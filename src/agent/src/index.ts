// Import Node.js Dependencies
import path from "node:path";
import timers from "node:timers/promises";

// Import Third-party Dependencies
import { initConfig } from "@sigyn/config";
import { GrafanaApi } from "@myunisoft/loki";
import { Agent, setGlobalDispatcher } from "@myunisoft/httpie";
import { ToadScheduler, CronJob, SimpleIntervalJob } from "toad-scheduler";
import { pino } from "pino";
import ms from "ms";

// Import Internal Dependencies
import { initDB, cleanRulesInDb } from "./database.js";
import { asyncTask } from "./tasks/asyncTask.js";
import { Rule } from "./rules.js";
import * as utils from "./utils/index.js";

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
  timeout?: number;
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
  const { logger, level = "info", timeout = 30_000 } = options;
  const agentLogger = logger ?? defaultLogger(level);

  agentLogger.info(`Starting sigyn agent at '${location}'`);

  setGlobalDispatcher(new Agent({ connect: { timeout } }));
  initDB(agentLogger);

  const { rules, loki } = await initConfig(
    path.join(location, "/sigyn.config.json")
  );

  const lokiApi = new GrafanaApi({
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
