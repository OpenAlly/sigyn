// Import Third-party Dependencies
import { GrafanaLoki } from "@myunisoft/loki";
import SQLite3 from "better-sqlite3";
import dayjs from "dayjs";
import { Logger } from "pino";
import ms from "ms";

// Import Internal Dependencies
import { DbCounter, DbRule, SigynRule } from "./types";
import { getDB } from "./database";
import * as utils from "./utils";
import { Alert } from "./alert";

// CONSTANTS
const kApi = new GrafanaLoki({
  remoteApiURL: "https://loki.myunisoft.fr"
});

export interface RuleOptions {
  logger: Logger;
}

export class Rule {
  #config: SigynRule;
  #db: SQLite3.Database;
  #logger: Logger;

  constructor(rule: SigynRule, options: RuleOptions) {
    this.#logger = options.logger;
    this.#config = rule;
    this.#db = getDB();
  }

  #getRuleFromDatabase(): DbRule {
    return this.#db.prepare("SELECT * FROM rules WHERE name = ?").get(this.#config.name) as DbRule;
  }

  init() {
    const databaseRule = this.#getRuleFromDatabase();

    if (databaseRule === undefined) {
      this.#db.prepare("INSERT INTO rules (name) VALUES (?)").run(this.#config.name);

      this.#logger.info(`[Database] New rule '${this.#config.name}' added`);
    }
  }

  async handleLogs(): Promise<void> {
    const logs = await kApi.queryRange(this.#config.logql, {
      start: this.#getQueryRangeStartUnixTimestamp()
    });
    const rule = this.#getRuleFromDatabase();
    const now = dayjs().unix();
    const lasttIntervalDate = utils.durationToDate(this.#config.alert.on.interval, "subtract");
    const timeThreshold = lasttIntervalDate.unix();

    const previousCounters = this.#db.prepare("SELECT * FROM counters WHERE ruleId = ? AND timestamp >= ?").all(
      rule.id,
      timeThreshold
    ) as DbCounter[];

    const previousCounter = previousCounters.reduce((acc, cur) => acc + cur.counter, 0);
    const substractCounter = (rule.counter - previousCounter);

    rule.counter -= substractCounter;
    rule.counter += logs.length;
    this.#db.prepare("UPDATE rules SET counter = ? WHERE id = ?").run(
      rule.counter,
      rule.id
    );

    if (logs.length) {
      this.#db.prepare("INSERT INTO counters (ruleId, counter, timestamp) VALUES (?, ?, ?)").run(
        rule.id,
        logs.length,
        now
      );
    }

    this.#db.prepare("DELETE FROM counters WHERE ruleId = ? AND timestamp < ?").run(
      rule.id,
      timeThreshold
    );

    const alertThreshold = this.#config.alert.on.count;

    // eslint-disable-next-line max-len
    this.#logger.info(`[${rule.name}](state: handle|previous: ${previousCounter}|new: ${logs.length}|next: ${rule.counter}|threshold: ${alertThreshold})`);


    if (rule.counter >= alertThreshold) {
      const alert = new Alert(rule.name, { logger: this.#logger });
      await alert.send();

      this.#db.prepare("UPDATE rules SET counter = 0 WHERE id = ?").run(rule.id);
      this.#db.prepare("DELETE from counters WHERE ruleId = ?").run(rule.id);

      this.#logger.error(`[${rule.name}](state: alert|threshold: ${alertThreshold}|actual: ${rule.counter})`);
    }
  }

  #getQueryRangeStartUnixTimestamp(): number {
    const rule = this.#getRuleFromDatabase();
    const now = dayjs();

    this.#db.prepare("UPDATE rules SET lastRunAt = ? WHERE id = ?").run(now.unix(), rule.id);

    if (rule.lastRunAt) {
      const diff = Math.abs(dayjs.unix(rule.lastRunAt!).diff(now, "ms"));
      const maxMsDiff = ms(this.#config.polling);

      if (diff <= Number(maxMsDiff)) {
        return rule.lastRunAt;
      }
    }

    return utils.durationToDate(this.#config.polling, "subtract").unix();
  }
}
