// Import Node.js Dependencies
import fs from "node:fs";
import path from "node:path";

// Import Third-party Dependencies
import { ToadScheduler, SimpleIntervalJob } from "toad-scheduler";
import { pino } from "pino";
import ms from "ms";

// Import Internal Dependencies
import { initDB } from "./database";
import { IRule, SigynConfig } from "./types";
import { asyncTask } from "./tasks/asyncTask";

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
  const db = initDB(kLogger);

  const rules = db.prepare("SELECT * FROM rules").all() as IRule[];

  for (const rule of rules) {
    const ruleConfig = config.rules.find((ruleConfig) => ruleConfig.name === rule.name);

    if (!ruleConfig) {
      // TODO: remove from db ?
      continue;
    }

    const task = asyncTask(ruleConfig, { ruleName: rule.name, logger: kLogger });
    const job = new SimpleIntervalJob({ milliseconds: ms(ruleConfig.polling), runImmediately: true }, task);

    kScheduler.addIntervalJob(job);
  }
  /**
   * TODO:
   * 3. schedule alerting interval
   *  3.1 looking in DB, if matching condition -> alert (delete proceeded rows)
   *  3.2 store in DB the alert, send event notification to notifiers
   */
}
