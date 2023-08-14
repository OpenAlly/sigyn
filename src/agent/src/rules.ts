/* eslint-disable max-len */
// Import Third-party Dependencies
import { SigynRule } from "@sigyn/config";
import dayjs from "dayjs";
import ms from "ms";
import cronParser from "cron-parser";
import { Database } from "better-sqlite3";

// Import Internal Dependencies
import { DbRule, getDB } from "./database";
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

  init(): void {
    const databaseRule = this.getRuleFromDatabase();

    if (databaseRule === undefined) {
      getDB().prepare("INSERT INTO rules (name) VALUES (?)").run(this.#config.name);

      this.#logger.info(`[Database] New rule '${this.#config.name}' added`);
    }
  }

  async walkOnLogs(logs: string[]): Promise<boolean> {
    const db = getDB();

    const rule = this.getRuleFromDatabase();
    const now = dayjs().valueOf();
    const timeThreshold = utils
      .durationOrCronToDate(this.#config.alert.on.interval, "subtract")
      .valueOf();

    const accumulatedCounters = (db
      .prepare("SELECT SUM(counter) as totalCounter FROM counters WHERE ruleId = ? AND timestamp >= ?")
      .get(rule.id, timeThreshold) as { totalCounter: number }).totalCounter ?? 0;

    // rule.counter has may not been updated yet, so we need to substract the diff with accumulatedCounters
    // i.e rule.counter = 10, but we have 5 counters in the DB within the interval, so we need to substract 5 to the rule.counter
    rule.counter = accumulatedCounters + logs.length;

    db.transaction(() => {
      db.prepare("UPDATE rules SET counter = ? WHERE id = ?").run(rule.counter, rule.id);
      db.prepare("INSERT INTO counters (ruleId, counter, timestamp) VALUES (?, ?, ?)").run(rule.id, logs.length, now);
      db.prepare("DELETE FROM counters WHERE ruleId = ? AND timestamp < ?").run(rule.id, timeThreshold);
    })();

    const alertThreshold = this.#config.alert.on.count;
    this.#logger.info(`[${rule.name}](state: handle|previous: ${accumulatedCounters}|new: ${logs.length}|next: ${rule.counter}|threshold: ${alertThreshold})`);

    const [operator, value] = utils.ruleCountThresholdOperator(alertThreshold);

    if (operator.startsWith("<")) {
      // we checking for a max value, so we want to wait the whole interval before sending an alert
      const countersAndSum = db.prepare(`
        SELECT COUNT(id) as count, SUM(counter) as totalCounter
        FROM counters
        WHERE ruleId = ?
      `).get(rule.id) as { count: number, totalCounter: number };

      const counters = countersAndSum.count;
      const accumulatedCountersInInterval = countersAndSum.totalCounter;

      const diffPolling = now - utils.durationOrCronToDate(this.#getCurrentPolling()[1], "subtract").valueOf();
      const diffInterval = now - timeThreshold;
      const expectedCounterCount = Math.floor(diffInterval / diffPolling);

      if (counters < expectedCounterCount) {
        return false;
      }

      if (!utils.ruleCountMatchOperator(operator, accumulatedCountersInInterval, value)) {
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
      db.prepare("UPDATE rules SET counter = 0 WHERE id = ?").run(rule.id);
      db.prepare("DELETE from counters WHERE ruleId = ?").run(rule.id);
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
      db.transaction(() => {
        db.prepare("UPDATE rules SET throttleCount = ?, counter = 0 WHERE id = ?").run(rule.throttleCount + 1, rule.id);
        db.prepare("DELETE from counters WHERE ruleId = ? AND timestamp <= ?").run(rule.id, intervalDate);
      })();

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
