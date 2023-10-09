/* eslint-disable max-len */
// Import Third-party Dependencies
import { SigynRule } from "@sigyn/config";
import { LokiStreamResult } from "@myunisoft/loki";
import dayjs from "dayjs";
import ms from "ms";
import cronParser from "cron-parser";
import { Database } from "better-sqlite3";

// Import Internal Dependencies
import { DbRule, DbRuleLabel, getDB, getOldestLabelTimestamp } from "./database";
import * as utils from "./utils/index";
import { Logger } from ".";
import { NotifierAlert } from "./notifier";

export interface RuleOptions {
  logger: Logger;
}

export class Rule {
  config: SigynRule;
  #logger: Logger;

  constructor(rule: SigynRule, options: RuleOptions) {
    const { logger } = options;

    this.#logger = logger;
    this.config = rule;
  }

  getRuleFromDatabase(): DbRule {
    return getDB().prepare("SELECT * FROM rules WHERE name = ?").get(this.config.name) as DbRule;
  }

  getAlertFormattedRule(): NotifierAlert["rule"] {
    const rule = this.getRuleFromDatabase();
    const formattedLabels = {};

    const labels = this.getDistinctLabelsFromDatabase(rule.id);
    for (const { key, value } of labels) {
      // if rule is based on current DB label, we take only if matching rule
      if (key === this.config.alert.on.label) {
        const { value: wantedValue, valueMatch } = this.config.alert.on;

        if (wantedValue) {
          const rangeValueMatch = utils.rules.OPERATOR_VALUE_REGEXP.exec(wantedValue);
          if (rangeValueMatch && !utils.rules.countMatchOperator(rangeValueMatch[1] as utils.rules.RuleOperators, Number(value), Number(rangeValueMatch[2]))) {
            continue;
          }
          else if (value !== wantedValue) {
            continue;
          }
        }
        else if (!value.match(valueMatch!)) {
          continue;
        }
      }

      if (formattedLabels[key] === undefined) {
        formattedLabels[key] = value;
      }
      else {
        formattedLabels[key] += `, ${value}`;
      }
    }

    return {
      ...rule,
      labels: formattedLabels,
      oldestLabelTimestamp: this.config.alert.on.label ? getOldestLabelTimestamp(rule.id, this.config.alert.on.label) : null
    };
  }

  getDistinctLabelsFromDatabase(ruleId: number): DbRuleLabel[] {
    return getDB().prepare("SELECT DISTINCT key, value FROM ruleLabels WHERE ruleId = ?").all(ruleId) as DbRuleLabel[];
  }

  clearLabels() {
    getDB().prepare("DELETE FROM ruleLabels WHERE ruleId = ?").run(this.getRuleFromDatabase().id);
  }

  init(): void {
    const databaseRule = this.getRuleFromDatabase();

    if (databaseRule === undefined) {
      getDB().prepare("INSERT INTO rules (name) VALUES (?)").run(this.config.name);

      this.#logger.info(`[Database] New rule '${this.config.name}' added`);
    }
  }

  async walkOnLogs(logs: LokiStreamResult[]): Promise<boolean> {
    const db = getDB();

    const now = dayjs().valueOf();
    const rule = this.getRuleFromDatabase();
    const ruleLabels = this.getDistinctLabelsFromDatabase(rule.id);
    const lastCounter = rule.counter;
    const existingLabels = new Set();
    for (const label of ruleLabels) {
      existingLabels.add(`${label.key}:${label.value}`);
    }
    const ruleLabelsInsertStmt = db.prepare("INSERT INTO ruleLabels (ruleId, key, value, timestamp) VALUES (?, ?, ?, ?)");
    const ruleLogInsertStmt = db.prepare("INSERT INTO ruleLogs (ruleId, log, timestamp) VALUES (?, ?, ?)");

    db.transaction(() => {
      for (const { stream, values } of logs) {
        for (const [key, value] of Object.entries(stream)) {
        // If rule is based on label, insert as many label as there is values
        // because we receive only one stream for N values (but the stream is the same for each value)
          if (this.config.alert.on.label === key) {
            let insertedCount = 0;

            while (insertedCount++ < values.length) {
              ruleLabelsInsertStmt.run(rule.id, key, value, now);
            }
          }
          else if (!existingLabels.has(`${key}:${value}`)) {
            ruleLabelsInsertStmt.run(rule.id, key, value, now);
            existingLabels.add(`${key}:${value}`);
          }
        }

        for (const log of values) {
          ruleLogInsertStmt.run(rule.id, log, now);
        }
      }
    })();

    if (this.config.alert.on.label) {
      return this.#checkLabelThreshold(rule);
    }

    const timeThreshold = utils.cron
      .durationOrCronToDate(this.config.alert.on.interval!, "subtract")
      .valueOf();

    if (rule.lastIntervalReset === null || rule.lastIntervalReset - timeThreshold < 0) {
      db.prepare("UPDATE rules SET lastIntervalReset = ?, firstReset = ? WHERE id = ?").run(now, rule.lastIntervalReset === null ? 1 : 0, rule.id);
      rule.firstReset = rule.lastIntervalReset === null ? 1 : 0;
      rule.lastIntervalReset = now;
    }

    rule.counter = (
      db.prepare("SELECT COUNT(id) as counter FROM ruleLogs WHERE ruleId = ? AND processed = 0 AND timestamp >= ?")
        .get(rule.id, timeThreshold) as { counter: null | number }
    ).counter ?? 0;

    db.prepare("UPDATE rules SET counter = ? WHERE id = ?").run(rule.counter, rule.id);

    const alertThreshold = this.config.alert.on.count!;
    this.#logger.info(`[${rule.name}](state: handle|logs: ${logs.reduce((acc, curr) => acc + curr.values.length, 0)}|polling: ${this.#getCurrentPolling()[1]}|previous: ${lastCounter}|new: ${rule.counter - lastCounter}|next: ${rule.counter}|alertThreshold: ${alertThreshold}|timeThreshold: ${timeThreshold})`);

    const [operator, value] = utils.rules.countThresholdOperator(alertThreshold);

    if (operator.startsWith("<")) {
      // we checking for a max value, so we want to wait the whole interval before sending an alert
      if (rule.lastIntervalReset !== now || rule.firstReset === 1) {
        return false;
      }

      if (!utils.rules.countMatchOperator(operator, rule.counter, value)) {
        return false;
      }
    }
    else if (!utils.rules.countMatchOperator(operator, rule.counter, value)) {
      return false;
    }

    const cancelAlert = this.#checkThrottle(rule, db);
    if (cancelAlert) {
      return false;
    }

    this.#logger.error(`[${rule.name}](state: alert|threshold: ${alertThreshold}|actual: ${rule.counter})`);

    db.transaction(() => {
      db.prepare("UPDATE rules SET counter = 0, threshold = ?, lastIntervalReset = ? WHERE id = ?").run(rule.counter, now, rule.id);
      db.prepare("UPDATE ruleLogs SET processed = 1 WHERE ruleId = ?").run(rule.id);
    })();

    return true;
  }

  #checkLabelThreshold(rule: DbRule): boolean {
    const { label, value, valueMatch, percentThreshold, count, minimumLabelCount, interval } = this.config.alert.on;

    const labels = getDB().prepare("SELECT * FROM ruleLabels WHERE key = ? AND ruleId = ? ORDER BY timestamp ASC").all(label, rule.id) as DbRuleLabel[];
    const [olderLabel] = labels;
    if (olderLabel === undefined) {
      this.#logger.info(`[${rule.name}](state: skip|label: ${label})`);

      return false;
    }
    const intervalTimestamp = interval ? utils.cron.durationOrCronToDate(interval!, "subtract").valueOf() : null;
    const intervalReached = interval ? intervalTimestamp! >= olderLabel.timestamp : true;
    const countReached = minimumLabelCount ? minimumLabelCount <= labels.length : true;

    if (!intervalReached || !countReached) {
      this.#logger.info(`[${rule.name}](state: unreached|labelCount: ${labels.length}|minimumLabelCount: ${minimumLabelCount || "*"}|oldestTimestamp: ${olderLabel.timestamp}|minimumTimestamp: ${intervalTimestamp ?? "*"})`);

      return false;
    }

    const labelMatchCount = labels.filter((label) => {
      if (value) {
        const rangeValueMatch = utils.rules.OPERATOR_VALUE_REGEXP.exec(value);

        if (rangeValueMatch) {
          return utils.rules.countMatchOperator(rangeValueMatch[1] as utils.rules.RuleOperators, Number(label.value), Number(rangeValueMatch[2]));
        }

        return label.value === value;
      }

      return label.value.match(valueMatch!);
    }).length;

    this.#logger.info(`[${rule.name}](state: reached|actual: ${labels.length}|count: ${count ?? "x"}|thresholdCount: ${labelMatchCount}|percentThreshold: ${percentThreshold}|actualPercent: ${labelMatchCount / labels.length * 100})`);

    if (percentThreshold) {
      return labelMatchCount / labels.length * 100 >= percentThreshold!;
    }

    const [operator, countValue] = utils.rules.countThresholdOperator(count!);

    return utils.rules.countMatchOperator(operator, labelMatchCount, countValue);
  }

  #checkThrottle(rule: DbRule, db: Database): boolean {
    const { throttle } = this.config.alert;

    if (!throttle) {
      return false;
    }

    const { interval, count, activationThreshold } = throttle;
    const intervalDate = utils.cron.durationOrCronToDate(interval, "subtract").valueOf();
    const ruleAlertsCount = db.prepare("SELECT * FROM alerts WHERE ruleId = ? AND createdAt >= ?").all(
      rule.id,
      intervalDate
    ).length;
    this.#logger.error(`[${rule.name}](activationThreshold: ${activationThreshold}|actual: ${ruleAlertsCount})`);
    if (count === 0 && ruleAlertsCount > 0) {
      this.#logger.error(`[${rule.name}](state: throttle|count: ${count}|actual: ${ruleAlertsCount})`);

      return true;
    }
    else if (ruleAlertsCount <= activationThreshold!) {
      this.#logger.error(`[${rule.name}](activationThreshold: ${activationThreshold}|actual: ${ruleAlertsCount})`);

      return false;
    }

    if (
      ruleAlertsCount > 0 &&
      (ruleAlertsCount + rule.throttleCount - activationThreshold < count)
    ) {
      db.prepare("UPDATE rules SET throttleCount = ?, counter = 0 WHERE id = ?").run(rule.throttleCount + 1, rule.id);

      return true;
    }

    db.prepare("UPDATE rules SET throttleCount = 0 WHERE id = ?").run(rule.id);

    return false;
  }

  getQueryRangeStartUnixTimestamp(): null | number {
    const rule = this.getRuleFromDatabase();
    const now = dayjs();

    getDB().prepare("UPDATE rules SET lastRunAt = ? WHERE id = ?").run(now.valueOf(), rule.id);

    const [isCron, polling] = this.#getCurrentPolling();

    if (isCron) {
      if (this.config.pollingStrategy === "bounded") {
        if (this.#shouldSkipCron(polling)) {
          return null;
        }
      }

      const interval = cronParser.parseExpression(polling);
      const prev = interval.prev().toString();

      if (new Date().toString() === prev) {
        return dayjs(interval.prev().toString()).unix();
      }

      return dayjs(prev).unix();
    }

    if (rule.lastRunAt) {
      const diff = Math.abs(dayjs.unix(rule.lastRunAt!).diff(now, "ms"));

      if (diff <= Number(ms(polling))) {
        // we store ms unix in DB while Loki API takes seconds unix
        return rule.lastRunAt / 1000;
      }
    }

    return utils.cron.durationOrCronToDate(polling, "subtract").unix();
  }

  /**
   * Whether the current cron should be skipped.
   *
   * For instance, given "* 7-20 * * *", at 7am we should skip polling if strategy is bounded.
   * Otherwise, it would fetch logs from 8:59pm to 7am which is not what we want with bounded strategy.
   *
   * The next one will not be skipped i.e. at 7:01 it will fetch logs from 7:00 to 7:01 so each logs in the cron range are fetched.
   * **Note: this function pretends the polling strategy to be bounded.**
   */
  #shouldSkipCron(polling: string) {
    const cron = cronParser.parseExpression(polling);
    const nextDate = dayjs(cron.next().toString());
    const currentDate = dayjs(cron.prev().toString());
    const previousDate = dayjs(cron.prev().toString());

    const previousDiff = Math.abs(previousDate.diff(currentDate, "ms"));
    const nextDiff = Math.abs(currentDate.diff(nextDate, "ms"));

    return nextDiff < previousDiff;
  }

  #getCurrentPolling(): utils.rules.RulePolling {
    const rulePollings = utils.rules.getPollings(this.config.polling);

    if (rulePollings.length === 1 && rulePollings[0][0] === false) {
      return rulePollings[0];
    }

    let currentPolling = rulePollings[0];

    for (const [, polling] of rulePollings) {
      const currentPollingDate = dayjs(cronParser.parseExpression(currentPolling[1]).next().toString());
      const nextCronDate = dayjs(cronParser.parseExpression(polling).next().toString());

      if (nextCronDate.isBefore(currentPollingDate)) {
        currentPolling = [true, polling];
      }
    }

    return currentPolling;
  }
}
