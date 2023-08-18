/* eslint-disable max-len */
// Import Third-party Dependencies
import { SigynRule } from "@sigyn/config";
import { LokiStreamResult } from "@myunisoft/loki";
import dayjs from "dayjs";
import ms from "ms";
import cronParser from "cron-parser";
import { Database } from "better-sqlite3";

// Import Internal Dependencies
import { DbRule, DbRuleLabel, getDB } from "./database";
import * as utils from "./utils";
import { Logger } from ".";

// CONSTANTS
export const DEFAULT_POLLING = "1m";

export interface RuleOptions {
  logger: Logger;
}

export class Rule {
  #config: SigynRule;
  #logger: Logger;

  constructor(rule: SigynRule, options: RuleOptions) {
    const { logger } = options;

    this.#logger = logger;
    this.#config = rule;
  }

  getRuleFromDatabase(): DbRule {
    return getDB().prepare("SELECT * FROM rules WHERE name = ?").get(this.#config.name) as DbRule;
  }

  getRuleFromDatabaseWithLabels(): DbRule & { labels: Record<string, string> } {
    const rule = this.getRuleFromDatabase();
    const formattedLabels = {};

    const labels = this.getRuleLabelsFromDatabase(rule.id);
    for (const { key, value } of labels) {
      if (formattedLabels[key] === undefined) {
        formattedLabels[key] = value;
      }
      else {
        formattedLabels[key] += `, ${value}`;
      }
    }

    return {
      ...rule,
      labels: formattedLabels
    };
  }

  getRuleLabelsFromDatabase(ruleId: number): DbRuleLabel[] {
    return getDB().prepare("SELECT * FROM ruleLabels WHERE ruleId = ?").all(ruleId) as DbRuleLabel[];
  }

  clearLabels() {
    getDB().prepare("DELETE FROM ruleLabels WHERE ruleId = ?").run(this.getRuleFromDatabase().id);
  }

  init(): void {
    const databaseRule = this.getRuleFromDatabase();

    if (databaseRule === undefined) {
      getDB().prepare("INSERT INTO rules (name) VALUES (?)").run(this.#config.name);

      this.#logger.info(`[Database] New rule '${this.#config.name}' added`);
    }
  }

  async walkOnLogs(logs: LokiStreamResult[]): Promise<boolean> {
    const db = getDB();

    const now = dayjs().valueOf();
    const timeThreshold = utils
      .durationOrCronToDate(this.#config.alert.on.interval, "subtract")
      .valueOf();
    const rule = this.getRuleFromDatabase();

    if (rule.lastIntervalReset === null || rule.lastIntervalReset - timeThreshold < 0) {
      db.prepare("UPDATE rules SET lastIntervalReset = ?, firstReset = ? WHERE id = ?").run(now, rule.lastIntervalReset === null ? 1 : 0, rule.id);
      rule.firstReset = rule.lastIntervalReset === null ? 1 : 0;
      rule.lastIntervalReset = now;
    }

    const lastCounter = rule.counter;
    const ruleLogLabels = this.getRuleLabelsFromDatabase(rule.id);

    for (const { stream, values } of logs) {
      for (const [key, value] of Object.entries(stream)) {
        const label = ruleLogLabels.find((label) => label.key === key && label.value === value);
        if (label === undefined) {
          const { lastInsertRowid } = db.prepare("INSERT INTO ruleLabels (ruleId, key, value) VALUES (?, ?, ?)").run(rule.id, key, value);
          ruleLogLabels.push({ id: Number(lastInsertRowid), ruleId: rule.id, key, value });
        }
      }

      for (const log of values) {
        db.prepare("INSERT INTO ruleLogs (ruleId, log, timestamp) VALUES (?, ?, ?)").run(rule.id, log, now);
      }
    }

    rule.counter = (
      db.prepare("SELECT COUNT(id) as counter FROM ruleLogs WHERE ruleId = ? AND processed = 0 AND timestamp >= ?")
        .get(rule.id, timeThreshold) as { counter: null | number }
    ).counter ?? 0;

    db.prepare("UPDATE rules SET counter = ? WHERE id = ?").run(rule.counter, rule.id);

    const alertThreshold = this.#config.alert.on.count;
    this.#logger.info(`[${rule.name}](state: handle|polling: ${this.#getCurrentPolling()[1]}|previous: ${lastCounter}|new: ${rule.counter - lastCounter}|next: ${rule.counter}|threshold: ${alertThreshold})`);

    const [operator, value] = utils.ruleCountThresholdOperator(alertThreshold);

    if (operator.startsWith("<")) {
      // we checking for a max value, so we want to wait the whole interval before sending an alert
      if (rule.lastIntervalReset !== now || rule.firstReset === 1) {
        return false;
      }

      if (!utils.ruleCountMatchOperator(operator, rule.counter, value)) {
        return false;
      }
    }
    else if (!utils.ruleCountMatchOperator(operator, rule.counter, value)) {
      return false;
    }

    const cancelAlert = this.#checkThrottle(rule, db);
    if (cancelAlert) {
      return false;
    }

    this.#logger.error(`[${rule.name}](state: alert|threshold: ${alertThreshold}|actual: ${rule.counter})`);

    db.transaction(() => {
      db.prepare("UPDATE rules SET counter = 0, lastIntervalReset = ? WHERE id = ?").run(now, rule.id);
      db.prepare("UPDATE ruleLogs SET processed = 1 WHERE ruleId = ?").run(rule.id);
    })();

    return true;
  }

  #checkThrottle(rule: DbRule, db: Database): boolean {
    const { throttle } = this.#config.alert;

    if (!throttle) {
      return false;
    }

    const { interval, count = 0 } = throttle;
    const intervalDate = utils.durationOrCronToDate(interval, "subtract").valueOf();
    const ruleAlertsCount = db.prepare("SELECT * FROM alerts WHERE ruleId = ? AND createdAt >= ?").all(
      rule.id,
      intervalDate
    ).length;

    if (count === 0 && ruleAlertsCount > 0) {
      this.#logger.error(`[${rule.name}](state: throttle|count: ${count}|actual: ${ruleAlertsCount})`);

      return true;
    }

    if (ruleAlertsCount > 0 && (ruleAlertsCount + rule.throttleCount) < count) {
      db.prepare("UPDATE rules SET throttleCount = ?, counter = 0 WHERE id = ?").run(rule.throttleCount + 1, rule.id);

      this.#logger.error(`[${rule.name}](state: throttle|count: ${count}|actual: ${ruleAlertsCount}|throttle: ${rule.throttleCount})`);

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
      if (this.#config.pollingStrategy === "bounded") {
        if (this.#shouldSkipCron(polling)) {
          return null;
        }
      }

      const interval = cronParser.parseExpression(polling);
      // skip current date (first .prev() is equal to a .current())
      interval.prev();

      return dayjs(interval.prev().toString()).unix();
    }

    if (rule.lastRunAt) {
      const diff = Math.abs(dayjs.unix(rule.lastRunAt!).diff(now, "ms"));

      if (diff <= Number(ms(polling))) {
        // we store ms unix in DB while Loki API takes seconds unix
        return rule.lastRunAt / 1000;
      }
    }

    return utils.durationOrCronToDate(polling, "subtract").unix();
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

  #getCurrentPolling(): utils.RulePolling {
    const rulePollings = utils.getRulePollings(this.#config.polling);

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
