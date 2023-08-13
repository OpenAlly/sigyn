// Import Third-party Dependencies
import { SigynRule } from "@sigyn/config";
import { GrafanaLoki } from "@myunisoft/loki";
import { AsyncTask } from "toad-scheduler";

// Import Internal Dependencies
import { DEFAULT_POLLING, Rule } from "../rules";
import { Logger } from "..";
import { createRuleAlert } from "../alert";

export interface AsyncTaskOptions {
  logger: Logger;
  rule: Rule;
  lokiApi: GrafanaLoki;
}

export function asyncTask(ruleConfig: SigynRule, options: AsyncTaskOptions) {
  const { rule, logger, lokiApi } = options;

  const task = new AsyncTask(ruleConfig.name, async() => {
    const logs = await lokiApi.queryRange(ruleConfig.logql, {
      start: rule.getQueryRangeStartUnixTimestamp()
    });

    const polling = ruleConfig.polling ?? DEFAULT_POLLING;

    try {
      logger.info(`[${ruleConfig.name}](state: polling start|polling: ${polling}|query: ${ruleConfig.logql})`);

      const createAlert = await rule.walkOnLogs(logs);
      if (createAlert) {
        createRuleAlert(rule.getRuleFromDatabase(), ruleConfig, logger);
      }
    }
    catch (e) {
      logger.error(`[${ruleConfig.name}](error: ${e.message})`);
    }
  });

  return task;
}
