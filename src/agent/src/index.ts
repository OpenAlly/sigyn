// Import Node.js Dependencies
import path from "node:path";
import timers from "node:timers/promises";

// Import Third-party Dependencies
import { initConfig } from "@sigyn/config";
import { GrafanaLoki } from "@myunisoft/loki";
import { ToadScheduler, CronJob, SimpleIntervalJob } from "toad-scheduler";
import { pino } from "pino";
import ms from "ms";

// Import Internal Dependencies
import { initDB } from "./database";
import { asyncTask } from "./tasks/asyncTask";
import { DEFAULT_POLLING, Rule } from "./rules";
import * as utils from "./utils";

// CONSTANTS
const kScheduler = new ToadScheduler();
const kLogger = pino({
  level: "info",
  transport: {
    target: "pino-pretty"
  }
});

export interface Logger {
  info: (message: string) => void;
  error: (message: string) => void;
}

export async function start(
  location = process.cwd(),
  logger: Logger = kLogger
) {
  kLogger.info(`Starting sigyn agent at '${location}'`);
  initDB(kLogger);

  const { rules, loki } = await initConfig(
    path.join(location, "/sigyn.config.json")
  );

  const lokiApi = new GrafanaLoki({
    remoteApiURL: loki.apiUrl
  });

  for (const ruleConfig of rules) {
    if (ruleConfig.disabled) {
      continue;
    }

    const rule = new Rule(ruleConfig, { logger });
    rule.init();

    const task = asyncTask(ruleConfig, { rule, logger, lokiApi });
    const rulePollings = utils.getRulePollings(ruleConfig.polling);

    for (const [isCron, polling] of rulePollings) {
      if (isCron) {
        const job = new CronJob({ cronExpression: polling }, task);

        kScheduler.addCronJob(job);
      }
      else {
        const job = new SimpleIntervalJob({
          milliseconds: ms(ruleConfig.polling ?? DEFAULT_POLLING),
          runImmediately: true
        }, task);

        // Run the job at the next loop iteration
        setImmediate(() => kScheduler.addIntervalJob(job));
      }
    }

    /**
     * Avoid scheduling all rules at the same time
     * Doing so will avoid the loop to starve
     */
    await timers.setTimeout(200);
  }

  utils.cleanRulesInDb(rules);

  return kScheduler;
}
