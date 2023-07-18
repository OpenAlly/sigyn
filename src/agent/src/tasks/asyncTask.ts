// Import Third-party Dependencies
import { GrafanaLoki } from "@myunisoft/loki";
import { AsyncTask } from "toad-scheduler";
import { Logger } from "pino";

// Import Internal Dependencies
import { Rule } from "../rules";
import { SigynRule } from "../types";

// CONSTANTS
const kApi = new GrafanaLoki({
  remoteApiURL: "https://loki.myunisoft.fr"
});

export interface AsyncTaskOptions {
  logger: Logger;
  ruleName: string;
}

export function asyncTask(ruleConfig: SigynRule, options: AsyncTaskOptions) {
  const { ruleName, logger } = options;

  const task = new AsyncTask(ruleName, async() => {
    try {
      logger.info(`[${ruleName}](state: polling start|polling: ${ruleConfig.polling}|query: ${ruleConfig.logql})`);

      const ruleHandler = new Rule(ruleConfig, { logger });

      const logs = await kApi.queryRange(ruleConfig.logql, {
        start: ruleHandler.getQueryRangeStartUnixTimestamp()
      });

      ruleHandler.handleLogs(logs);
    }
    catch (e) {
      logger.error(`[${ruleName}](error: ${e.message})`);
    }
  });

  return task;
}
