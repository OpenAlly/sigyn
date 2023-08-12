/* eslint-disable max-len */
// Import Third-party Dependencies
import { SigynRule, getConfig } from "@sigyn/config";
import { GrafanaLoki } from "@myunisoft/loki";
import dayjs from "dayjs";
import ms from "ms";
import cronParser from "cron-parser";

// Import Internal Dependencies
import { DbCounter, DbRule, getDB } from "./database";
import * as utils from "./utils";
import { createAlert } from "./alert";
import { Logger } from ".";
import { Database } from "better-sqlite3";

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


  #getRuleFromDatabase(): DbRule {
    return getDB().prepare("SELECT * FROM rules WHERE name = ?").get(this.#config.name) as DbRule;
  }

  init(): void {
    const databaseRule = this.#getRuleFromDatabase();

    if (databaseRule === undefined) {
      getDB().prepare("INSERT INTO rules (name) VALUES (?)").run(this.#config.name);

      this.#logger.info(`[Database] New rule '${this.#config.name}' added`);
    }
  }

  async handleLogs(): Promise<void> {
    const db = getDB();

    const lokiApi = new GrafanaLoki({
      remoteApiURL: getConfig().loki.apiUrl
    });
    const logs = await lokiApi.queryRange(this.#config.logql, {
      start: this.#getQueryRangeStartUnixTimestamp()
    });

    const rule = this.#getRuleFromDatabase();
    const now = dayjs().unix();
    const timeThreshold = utils
      .durationOrCronToDate(this.#config.alert.on.interval, "subtract")
      .unix();

    const countersInThresholdInterval = db.prepare("SELECT * FROM counters WHERE ruleId = ? AND timestamp >= ?").all(
      rule.id,
      timeThreshold
    ) as DbCounter[];
    const accumulatedCounters = countersInThresholdInterval.reduce((acc, cur) => acc + cur.counter, 0);

    rule.counter -= rule.counter - accumulatedCounters;
    rule.counter += logs.length;
    db.prepare("UPDATE rules SET counter = ? WHERE id = ?").run(
      rule.counter,
      rule.id
    );
    db.prepare("INSERT INTO counters (ruleId, counter, timestamp) VALUES (?, ?, ?)").run(
      rule.id,
      logs.length,
      now
    );
    db.prepare("DELETE FROM counters WHERE ruleId = ? AND timestamp < ?").run(
      rule.id,
      timeThreshold
    );

    const alertThreshold = this.#config.alert.on.count;
    this.#logger.info(`[${rule.name}](state: handle|previous: ${accumulatedCounters}|new: ${logs.length}|next: ${rule.counter}|threshold: ${alertThreshold})`);

    const [operator, value] = utils.ruleCountThresholdOperator(alertThreshold);
    if (!utils.ruleCountMatchOperator(operator, rule.counter, value)) {
      return;
    }

    if (operator.startsWith("<")) {
      // we checking for a max value, so we want to wait the whole interval before sending an alert
      const counters = db.prepare("SELECT * FROM counters WHERE ruleId = ?").all(
        rule.id
      ) as DbCounter[];

      const diffPolling = dayjs().unix() - utils.durationOrCronToDate(this.#getCurrentPolling()[1], "subtract").unix();
      const diffInterval = dayjs().unix() - timeThreshold;
      const expectedCounterCount = Math.ceil(diffInterval / diffPolling);

      // check it fetch since the rule interval (i.e if interval is 1m and we fetch every 30s, we want to check there is at least 2 counters)
      if (counters.length < expectedCounterCount) {
        return;
      }

      const countInInterval = counters.reduce((acc, cur) => acc + cur.counter, 0);
      if (!utils.ruleCountMatchOperator(operator, countInInterval, value)) {
        return;
      }
    }

    const cancelAlert = this.#checkThrottle(rule, db);
    if (cancelAlert) {
      return;
    }

    this.#logger.error(`[${rule.name}](state: alert|threshold: ${alertThreshold}|actual: ${rule.counter})`);
    createAlert(rule, this.#config, this.#logger);

    db.prepare("UPDATE rules SET counter = 0 WHERE id = ?").run(rule.id);
    db.prepare("DELETE from counters WHERE ruleId = ?").run(rule.id);
  }

  #checkThrottle(rule: DbRule, db: Database): boolean {
    if (!this.#config.alert.throttle) {
      return false;
    }

    const { interval, count = 0 } = this.#config.alert.throttle;
    const intervalDate = utils.durationOrCronToDate(interval, "subtract").unix();
    const ruleAlertsCount = db.prepare("SELECT * FROM alerts WHERE ruleId = ? AND createdAt >= ?").all(
      rule.id,
      intervalDate
    ).length;

    if (count === 0 && ruleAlertsCount > 0) {
      this.#logger.error(`[${rule.name}](state: throttle|count: ${count}|actual: ${ruleAlertsCount})`);

      return true;
    }

    if (ruleAlertsCount > 0 && (ruleAlertsCount + rule.throttleCount) < count) {
      db.prepare("UPDATE rules SET throttleCount = ? WHERE id = ?").run(
        rule.throttleCount + 1,
        rule.id
      );
      db.prepare("UPDATE rules SET counter = 0 WHERE id = ?").run(rule.id);
      db.prepare("DELETE from counters WHERE ruleId = ? AND timestamp <= ?").run(rule.id, intervalDate);

      this.#logger.error(`[${rule.name}](state: throttle|count: ${count}|actual: ${ruleAlertsCount}|throttle: ${rule.throttleCount})`);

      return true;
    }

    db.prepare("UPDATE rules SET throttleCount = 0 WHERE id = ?").run(
      rule.id
    );

    return false;
  }

  #getQueryRangeStartUnixTimestamp(): number {
    const rule = this.#getRuleFromDatabase();
    const now = dayjs();

    getDB().prepare("UPDATE rules SET lastRunAt = ? WHERE id = ?").run(now.unix(), rule.id);

    const [isCron, polling] = this.#getCurrentPolling();

    if (isCron) {
      const interval = cronParser.parseExpression(polling);
      // skip the first previous interval as it's the current one
      interval.prev();

      return dayjs(interval.prev().toString()).unix();
    }

    if (rule.lastRunAt) {
      const diff = Math.abs(dayjs.unix(rule.lastRunAt!).diff(now, "ms"));

      if (diff <= Number(ms(polling))) {
        return rule.lastRunAt;
      }
    }

    return utils.durationOrCronToDate(polling, "subtract").unix();
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
