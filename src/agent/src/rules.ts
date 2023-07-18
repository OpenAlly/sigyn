// Import Third-party Dependencies
import SQLite3 from "better-sqlite3";
import dayjs from "dayjs";
import { Logger } from "pino";
import ms from "ms";

// Import Internal Dependencies
import { ICounter, IRule, SigynRule } from "./types";
import { getDB } from "./database";
import * as utils from "./utils";

interface RuleOptions {
  logger: Logger;
}

export class Rule {
  #ruleConfig: SigynRule;
  #rule: IRule;
  #databaseRules: IRule[];
  #db: SQLite3.Database;
  #logger: Logger;

  constructor(rule: SigynRule, options: RuleOptions) {
    this.#logger = options.logger;
    this.#ruleConfig = rule;
    this.#db = getDB();
    this.#rule = this.#getRuleFromDatabase();
    this.#databaseRules = this.#db.prepare("SELECT * FROM rules").all() as IRule[];
  }

  #getRuleFromDatabase(): IRule {
    return this.#db.prepare("SELECT * FROM rules WHERE name = ?").get(this.#ruleConfig.name) as IRule;
  }

  init() {
    const databaseRule = this.#databaseRules.find((dbRule) => dbRule.name === this.#rule.name);

    if (databaseRule === undefined) {
      this.#db.prepare("INSERT INTO rules (name) VALUES (?)").run(this.#rule.name);

      this.#logger.info(`[Database] New rule '${this.#rule.name}' added`);
    }
  }

  handleLogs(logs: string[]): void {
    this.#rule = this.#getRuleFromDatabase();

    const now = dayjs().unix();
    const lasttIntervalDate = utils.durationToDate(this.#ruleConfig.alert.on.interval, "subtract");
    const timeThreshold = lasttIntervalDate.unix();

    const previousCounters = this.#db.prepare("SELECT * FROM counters WHERE name = ? AND timestamp >= ?").all(
      this.#rule.name,
      timeThreshold
    ) as ICounter[];

    const previousCounter = previousCounters.reduce((acc, cur) => acc + cur.counter, 0);
    const substractCounter = (this.#rule.counter - previousCounter);

    this.#rule.counter -= substractCounter;
    this.#rule.counter += logs.length;

    this.#db.prepare("UPDATE rules SET counter = ? WHERE name = ?").run(
      this.#rule.counter,
      this.#rule.name
    );

    if (logs.length) {
      this.#db.prepare("INSERT INTO counters (name, counter, timestamp) VALUES (?, ?, ?)").run(
        this.#rule.name,
        logs.length,
        now
      );
    }

    this.#db.prepare("DELETE FROM counters WHERE name = ? AND timestamp < ?").run(
      this.#rule.name,
      timeThreshold
    );

    const alertThreshold = this.#ruleConfig.alert.on.count;

    // eslint-disable-next-line max-len
    this.#logger.info(`[${this.#rule.name}](state: handle|previous: ${previousCounter}|new: ${logs.length}|next: ${this.#rule.counter}|threshold: ${alertThreshold})`);


    if (this.#rule.counter >= alertThreshold) {
      this.#logger.error(`[${this.#rule.name}](state: alert|threshold: ${alertThreshold}|actual: ${this.#rule.counter})`);
    }
  }

  getQueryRangeStartUnixTimestamp(): number {
    const now = dayjs();
    const unixTimestamp = now.unix();

    this.#db.prepare("UPDATE rules SET lastRunAt = ? WHERE name = ?").run(unixTimestamp, this.#rule.name);

    const maxMsDiff = ms(this.#ruleConfig.polling);

    if (this.#rule.lastRunAt) {
      const diff = Math.abs(dayjs.unix(this.#rule.lastRunAt!).diff(now, "ms"));

      if (diff <= Number(maxMsDiff)) {
        // last polling was too long time ago, reset
        return this.#rule.lastRunAt;
      }
    }

    return utils.durationToDate(this.#ruleConfig.polling, "subtract").unix();
  }
}
