// Import Third-party Dependencies
import { type SigynInitializedRule } from "@sigyn/config";
import { type LokiCombined } from "@myunisoft/loki";
import dayjs from "dayjs";
import ms from "ms";
import { CronExpressionParser } from "cron-parser";
import { type Database } from "better-sqlite3";
import { Result, Ok, Err } from "@openally/result";

// Import Internal Dependencies
import { type DbRule, type DbRuleLabel, getDB, getOldestLabelTimestamp } from "./database.ts";
import * as utils from "./utils/index.ts";
import { type Logger } from "./index.ts";
import { type RuleNotifierAlert } from "./notifiers/rules.notifier.ts";

export interface RuleOptions {
  logger: Logger;
}

export class Rule {
  config: SigynInitializedRule;
  #logger: Logger;
  #lastFetchedStream: Record<string, string> | null = null;
  #now: number;
  #labelCount: number = 0;
  #labelMatchCount: number = 0;
  #labelMatchPercent: number | undefined;

  constructor(rule: SigynInitializedRule, options: RuleOptions) {
    const { logger } = options;

    this.#logger = logger;
    this.config = rule;
  }

  getRuleFromDatabase(): DbRule {
    return getDB().prepare("SELECT * FROM rules WHERE name = ?").get(this.config.name) as DbRule;
  }

  getAlertFormattedRule(): RuleNotifierAlert["rule"] {
    const rule = this.getRuleFromDatabase();
    const formattedLabels = Object.create(null);

    const labels = this.getDistinctLabelsFromDatabase(rule.id);
    for (const { key, value } of labels) {
      // if rule is based on current DB label, we take only if matching rule
      if (key === this.config.alert.on.label) {
        const { value: wantedValue, valueMatch } = this.config.alert.on;

        if (wantedValue) {
          const rangeValueMatch = utils.rules.OPERATOR_VALUE_REGEXP.exec(wantedValue);
          if (rangeValueMatch && !utils.rules.countMatchOperator(
            rangeValueMatch[1] as utils.rules.RuleOperators,
            Number(value),
            Number(rangeValueMatch[2])
          )) {
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
      oldestLabelTimestamp: this.config.alert.on.label ? getOldestLabelTimestamp(rule.id, this.config.alert.on.label) : null,
      labelCount: this.#labelCount,
      labelMatchCount: this.#labelMatchCount,
      labelMatchPercent: this.#labelMatchPercent
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

  walkOnLogs(logs: LokiCombined<string>[]): Result<true, string> {
    this.#lastFetchedStream = null;
    this.#now = dayjs().valueOf();

    const db = getDB();
    const rule = this.getRuleFromDatabase();

    if (rule.muteUntil > this.#now) {
      return Err("Rule is muted by higher level composite rule");
    }

    this.#insertLogsInDB(logs);

    if (this.config.alert.on.label) {
      const checkLabelThreshold = this.#checkLabelThreshold(rule);

      return checkLabelThreshold ? Ok(true) : Err("Label threshold does not match");
    }

    const timeThreshold = utils.cron
      .durationOrCronToDate(this.config.alert.on.interval!, "subtract")
      .valueOf();

    if (rule.lastIntervalReset === null || rule.lastIntervalReset - timeThreshold < 0) {
      db
        .prepare("UPDATE rules SET lastIntervalReset = ?, firstReset = ? WHERE id = ?")
        .run(this.#now, rule.lastIntervalReset === null ? 1 : 0, rule.id);
      rule.firstReset = rule.lastIntervalReset === null ? 1 : 0;
      rule.lastIntervalReset = this.#now;
    }

    const previousCounter = rule.counter;
    rule.counter = (
      db.prepare("SELECT COUNT(id) as counter FROM ruleLogs WHERE ruleId = ? AND processed = 0 AND timestamp >= ?")
        .get(rule.id, timeThreshold) as { counter: null | number; }
    ).counter ?? 0;

    db.prepare("UPDATE rules SET counter = ? WHERE id = ?").run(rule.counter, rule.id);

    const alertThreshold = this.config.alert.on.count!;
    // eslint-disable-next-line @stylistic/max-len
    this.#logger.info(`[${rule.name}](state: handle|polling: ${this.#getCurrentPolling()[1]}|previous: ${previousCounter}|new: ${rule.counter - previousCounter}|next: ${rule.counter}|alertThreshold: ${alertThreshold}|timeThreshold: ${timeThreshold})`);

    const [operator, value] = utils.rules.countThresholdOperator(alertThreshold);

    // we checking for a max value, so we want to wait the whole interval before sending an alert
    if (operator.startsWith("<") && (rule.lastIntervalReset !== this.#now || rule.firstReset === 1)) {
      return Err("Waiting the whole interval before comparing logs");
    }
    else if (!utils.rules.countMatchOperator(operator, rule.counter, value)) {
      return Err(`Logs does not match operator value (o:${operator}|c:${rule.counter}|v:${value})`);
    }

    const cancelAlert = this.#checkThrottle(rule, db);
    if (cancelAlert) {
      return Err("Rule throttle activated");
    }

    this.#logger.error(`[${rule.name}](state: alert|threshold: ${alertThreshold}|actual: ${rule.counter})`);

    db.transaction(() => {
      db
        .prepare("UPDATE rules SET counter = 0, threshold = ?, lastIntervalReset = ? WHERE id = ?")
        .run(rule.counter, this.#now, rule.id);
      db.prepare("UPDATE ruleLogs SET processed = 1 WHERE ruleId = ?").run(rule.id);
    })();

    return Ok(true);
  }

  #insertLogsInDB(logs: LokiCombined<string>[]): void {
    const rule = this.getRuleFromDatabase();
    const ruleLabels = this.getDistinctLabelsFromDatabase(rule.id);
    const existingLabels = new Set();
    for (const label of ruleLabels) {
      existingLabels.add(`${label.key}:${label.value}`);
    }
    const db = getDB();
    const ruleLabelsInsertStmt = db.prepare("INSERT INTO ruleLabels (ruleId, key, value, timestamp) VALUES (?, ?, ?, ?)");
    const ruleLogInsertStmt = db.prepare("INSERT INTO ruleLogs (ruleId, log, timestamp) VALUES (?, ?, ?)");

    db.transaction(() => {
      for (const { labels: stream, values } of logs) {
        if (this.#lastFetchedStream === null) {
          this.#lastFetchedStream = stream;
        }
        for (const [key, value] of Object.entries(stream)) {
          if (!(this.#lastFetchedStream![key] ??= value).split(",").includes(value)) {
            this.#lastFetchedStream![key] += `,${value}`;
          }

          // If rule is based on label, insert as many label as there is values
          // because we receive only one stream for N values (but the stream is the same for each value)
          if (this.config.alert.on.label === key) {
            let insertedCount = 0;

            while (insertedCount++ < values.length) {
              ruleLabelsInsertStmt.run(rule.id, key, value, this.#now);
            }
          }
          else if (!existingLabels.has(`${key}:${value}`)) {
            ruleLabelsInsertStmt.run(rule.id, key, value, this.#now);
            existingLabels.add(`${key}:${value}`);
          }
        }

        for (const [log] of values) {
          ruleLogInsertStmt.run(rule.id, log, this.#now);
        }
      }
    })();
  }

  #checkLabelThreshold(rule: DbRule): boolean {
    const {
      label,
      value,
      valueMatch,
      percentThreshold,
      count,
      minimumLabelCount,
      interval
    } = this.config.alert.on;

    const labels = getDB()
      .prepare("SELECT * FROM ruleLabels WHERE key = ? AND ruleId = ? ORDER BY timestamp ASC")
      .all(label, rule.id) as DbRuleLabel[];
    const [olderLabel] = labels;
    if (olderLabel === undefined) {
      this.#logger.info(`[${rule.name}](state: skip|label: ${label})`);

      return false;
    }
    const intervalTimestamp = interval ? utils.cron.durationOrCronToDate(interval!, "subtract").valueOf() : null;
    const intervalReached = interval ? intervalTimestamp! >= olderLabel.timestamp : true;
    const countReached = minimumLabelCount ? minimumLabelCount <= labels.length : true;

    if (!intervalReached || !countReached) {
      // eslint-disable-next-line @stylistic/max-len
      this.#logger.info(`[${rule.name}](state: unreached|labelCount: ${labels.length}|minimumLabelCount: ${minimumLabelCount || "*"}|oldestTimestamp: ${olderLabel.timestamp}|minimumTimestamp: ${intervalTimestamp ?? "*"})`);

      return false;
    }

    const labelMatchCount = labels.filter((label) => {
      if (value) {
        const rangeValueMatch = utils.rules.OPERATOR_VALUE_REGEXP.exec(value);

        if (rangeValueMatch) {
          return utils.rules.countMatchOperator(
            rangeValueMatch[1] as utils.rules.RuleOperators,
            Number(label.value),
            Number(rangeValueMatch[2])
          );
        }

        return label.value === value;
      }

      return label.value.match(valueMatch!);
    }).length;

    // eslint-disable-next-line @stylistic/max-len
    this.#logger.info(`[${rule.name}](state: reached|actual: ${labels.length}|count: ${count ?? "x"}|thresholdCount: ${labelMatchCount}|percentThreshold: ${percentThreshold}|actualPercent: ${labelMatchCount / labels.length * 100})`);

    this.#labelCount = labels.length;
    this.#labelMatchCount = labelMatchCount;

    if (percentThreshold) {
      this.#labelMatchPercent = labelMatchCount / labels.length * 100;

      return labelMatchCount / labels.length * 100 >= percentThreshold!;
    }

    const [operator, countValue] = utils.rules.countThresholdOperator(count!);

    return utils.rules.countMatchOperator(operator, labelMatchCount, countValue);
  }

  #ruleAlertsCount(rule: DbRule, interval: number): number {
    const labelScope = this.config.alert.throttle!.labelScope;
    if (labelScope.length > 0) {
      if (this.#lastFetchedStream === null) {
        return 0;
      }

      const alerts = getDB().prepare(
        `SELECT alertId, key, value FROM alertLabels WHERE key IN (${labelScope.map(() => "?").join(",")})`
      ).all(labelScope) as { alertId: number; key: string; value: string; }[];

      const alertIds = alerts.flatMap((alert) => {
        if (this.#lastFetchedStream![alert.key].split(",").includes(alert.value)) {
          return [alert.alertId];
        }

        return [];
      });

      if (alertIds.length === 0) {
        return 0;
      }

      return (getDB()
        .prepare(`SELECT COUNT(id) as count FROM alerts WHERE id IN (${alertIds.map(() => "?").join(",")}) AND createdAt >= ?`)
        .get(
          alertIds,
          interval
        ) as { count: number; }
      ).count;
    }

    return (getDB().prepare("SELECT COUNT(id) as count FROM alerts WHERE ruleId = ? AND createdAt >= ?").get(
      rule.id,
      interval
    ) as { count: number; }).count;
  }

  #checkThrottle(rule: DbRule, db: Database): boolean {
    const { throttle } = this.config.alert;

    if (!throttle) {
      return false;
    }

    const { interval, count, activationThreshold } = throttle;
    const intervalDate = utils.cron.durationOrCronToDate(interval, "subtract").valueOf();
    const ruleAlertsCount = this.#ruleAlertsCount(rule, intervalDate);
    const labelScope = throttle.labelScope.length > 0 ? throttle.labelScope.join(", ") : "*";

    if (count === 0 && ruleAlertsCount > 0) {
      this.#logger.error(`[${rule.name}](state: throttle|count: ${count}|actual: ${ruleAlertsCount}|labelScope: ${labelScope})`);

      return true;
    }
    else if (ruleAlertsCount <= activationThreshold!) {
      // eslint-disable-next-line @stylistic/max-len
      this.#logger.error(`[${rule.name}](activationThreshold: ${activationThreshold}|actual: ${ruleAlertsCount}|labelScope: ${labelScope})`);

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

      const interval = CronExpressionParser.parse(polling);
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
    const cron = CronExpressionParser.parse(polling);
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
      const currentPollingDate = dayjs(CronExpressionParser.parse(currentPolling[1]).next().toString());
      const nextCronDate = dayjs(CronExpressionParser.parse(polling).next().toString());

      if (nextCronDate.isBefore(currentPollingDate)) {
        currentPolling = [true, polling];
      }
    }

    return currentPolling;
  }
}
