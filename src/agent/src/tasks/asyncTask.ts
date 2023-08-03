// Import Third-party Dependencies
import { SigynRule } from "@sigyn/config";
import { AsyncTask } from "toad-scheduler";

// Import Internal Dependencies
import { DEFAULT_POLLING, Rule } from "../rules";
import { Logger } from "..";

export interface AsyncTaskOptions {
  logger: Logger;
  rule: Rule;
}

export function asyncTask(ruleConfig: SigynRule, options: AsyncTaskOptions) {
  const { rule, logger } = options;

  const task = new AsyncTask(ruleConfig.name, async() => {
    const polling = ruleConfig.polling ?? DEFAULT_POLLING;

    try {
      logger.info(`[${ruleConfig.name}](state: polling start|polling: ${polling}|query: ${ruleConfig.logql})`);

      await rule.handleLogs();
    }
    catch (e) {
      logger.error(`[${ruleConfig.name}](error: ${e.message})`);
    }
  });

  return task;
}
