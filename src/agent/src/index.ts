// Import Third-party Dependencies
import { ToadScheduler, CronJob, SimpleIntervalJob } from "toad-scheduler";
import { pino } from "pino";
import ms from "ms";

// Import Internal Dependencies
import { initDB } from "./database";
import { asyncTask } from "./tasks/asyncTask";
import { Rule } from "./rules";
import * as utils from "./utils";
import * as config from "./config";

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

  initDB(kLogger);

  const { rules } = config.initConfig(location);

  for (const ruleConfig of rules) {
    if (ruleConfig.disabled) {
      continue;
    }

    const rule = new Rule(ruleConfig, { logger: kLogger });
    rule.init();

    const task = asyncTask(ruleConfig, { rule, logger: kLogger });
    const rulePollings = utils.getRulePollings(ruleConfig.polling);

    for (const [isCron, polling] of rulePollings) {
      if (isCron) {
        const job = new CronJob({ cronExpression: polling }, task);

        kScheduler.addCronJob(job);

        continue;
      }

      const job = new SimpleIntervalJob({ milliseconds: ms(ruleConfig.polling), runImmediately: true }, task);

      kScheduler.addIntervalJob(job);
    }
  }

  utils.cleanRulesInDb(rules);
}
