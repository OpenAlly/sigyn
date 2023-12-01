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
import { initDB, cleanRulesInDb } from "./database";
import { asyncTask } from "./tasks/asyncTask";
import { Rule } from "./rules";
import * as utils from "./utils/index";

// CONSTANTS
const kScheduler = new ToadScheduler();

export interface Logger {
  info: (message: string) => void;
  error: (message: string) => void;
  debug: (message: string) => void;
}

export interface StartOptions {
  logger?: Logger;
  level?: "info" | "debug" | "error";
}

function defaultLogger(level: StartOptions["level"]) {
  return pino({
    level,
    transport: {
      target: "pino-pretty"
    }
  });
}

export async function start(
  location = process.cwd(),
  options: StartOptions = {}
) {
  const { logger, level = "info" } = options;
  const agentLogger = logger ?? defaultLogger(level);

  agentLogger.info(`Starting sigyn agent at '${location}'`);
  initDB(agentLogger);

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

    const rule = new Rule(ruleConfig, { logger: agentLogger });
    rule.init();

    const task = asyncTask(ruleConfig, { rule, logger: agentLogger, lokiApi });
    const rulePollings = utils.rules.getPollings(ruleConfig.polling);

    for (const [isCron, polling] of rulePollings) {
      if (isCron) {
        const job = new CronJob({ cronExpression: polling }, task);

        kScheduler.addCronJob(job);
      }
      else {
        const job = new SimpleIntervalJob({
          milliseconds: ms(ruleConfig.polling),
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

  cleanRulesInDb(rules);

  return kScheduler;
}
