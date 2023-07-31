// Import Third-party Dependencies
import { SigynRule } from "@sigyn/config";
import { GrafanaLoki } from "@myunisoft/loki";
import dayjs from "dayjs";
import { Logger } from "pino";
import ms from "ms";
import cronParser from "cron-parser";

// Import Internal Dependencies
import { DbCounter, DbRule, getDB } from "./database";
import * as utils from "./utils";
import { createAlert } from "./alert";

// CONSTANTS
const kApi = new GrafanaLoki({
  remoteApiURL: "https://loki.myunisoft.fr"
});

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
    const logs = await kApi.queryRange(this.#config.logql, {
      start: this.#getQueryRangeStartUnixTimestamp()
    });
    const rule = this.#getRuleFromDatabase();
    const now = dayjs().unix();
    const lasttIntervalDate = utils.durationOrCronToDate(this.#config.alert.on.interval, "subtract");
    const timeThreshold = lasttIntervalDate.unix();

    const previousCounters = db.prepare("SELECT * FROM counters WHERE ruleId = ? AND timestamp >= ?").all(
      rule.id,
      timeThreshold
    ) as DbCounter[];

    const previousCounter = previousCounters.reduce((acc, cur) => acc + cur.counter, 0);
    const substractCounter = (rule.counter - previousCounter);

    rule.counter -= substractCounter;
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

    const alertThreshold = this.#config.alert.on.count;

    // eslint-disable-next-line max-len
    this.#logger.info(`[${rule.name}](state: handle|previous: ${previousCounter}|new: ${logs.length}|next: ${rule.counter}|threshold: ${alertThreshold})`);


    const [operator, value] = utils.ruleCountThresholdOperator(alertThreshold);

    if (utils.ruleCountMatchOperator(operator, rule.counter, value)) {
      if (operator.startsWith("<")) {
        // we checking for a max value, so we want to wait the whole interval before sending an alert
        const counters = db.prepare("SELECT * FROM counters WHERE ruleId = ? AND timestamp <= ?").all(
          rule.id,
          timeThreshold
        ) as DbCounter[];

        if (counters.length === 0) {
          return;
        }
      }

      this.#logger.error(`[${rule.name}](state: alert|threshold: ${alertThreshold}|actual: ${rule.counter})`);

      createAlert(rule, this.#config, this.#logger);

      db.prepare("UPDATE rules SET counter = 0 WHERE id = ?").run(rule.id);
      db.prepare("DELETE from counters WHERE ruleId = ?").run(rule.id);
    }

    db.prepare("DELETE FROM counters WHERE ruleId = ? AND timestamp < ?").run(
      rule.id,
      timeThreshold
    );
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
