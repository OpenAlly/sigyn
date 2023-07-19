// Import Node.js Dependencies
import fs from "node:fs";
import path from "node:path";

// Import Third-party Dependencies
import { ToadScheduler, SimpleIntervalJob } from "toad-scheduler";
import { pino } from "pino";
import ms from "ms";

// Import Internal Dependencies
import { initDB } from "./database";
import { SigynConfig } from "./types";
import { asyncTask } from "./tasks/asyncTask";
import { Rule } from "./rules";
import * as utils from "./utils";

// CONSTANTS
const kScheduler = new ToadScheduler();
const kLogger = pino({
  level: "info",
  transport: process.env.MODE === "dev" ? {
    target: "pino-pretty"
  } : undefined
});

export async function start(
  location = process.cwd()
) {
  kLogger.info(`Starting sigyn agent at '${location}'`);

  const config = JSON.parse(fs.readFileSync(path.join(location, "/config.json"), "utf-8")) as SigynConfig;
  initDB(kLogger);

  for (const ruleConfig of config.rules) {
    const rule = new Rule(ruleConfig, { logger: kLogger });
    rule.init();

    const task = asyncTask(ruleConfig, { rule, logger: kLogger });
    const job = new SimpleIntervalJob({ milliseconds: ms(ruleConfig.polling), runImmediately: true }, task);

    kScheduler.addIntervalJob(job);
  }

  utils.cleanRulesInDb(config.rules);

  /**
   * TODO:
   * 3. schedule alerting interval
   *  3.1 looking in DB, if matching condition -> alert (delete proceeded rows)
   *  3.2 store in DB the alert, send event notification to notifiers
   */
}
