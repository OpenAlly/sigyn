// Import Third-party Dependencies
import { SigynInitializedRule } from "@sigyn/config";
import { GrafanaLoki } from "@myunisoft/loki";
import { AsyncTask } from "toad-scheduler";

// Import Internal Dependencies
import { Rule } from "../rules";
import { Logger } from "..";
import { createRuleAlert } from "../alert";
import { handleAgentFailure } from "../utils/selfMonitoring";

export interface AsyncTaskOptions {
  logger: Logger;
  rule: Rule;
  lokiApi: GrafanaLoki;
}

export function asyncTask(ruleConfig: SigynInitializedRule, options: AsyncTaskOptions) {
  const { rule, logger, lokiApi } = options;

  const task = new AsyncTask(ruleConfig.name, async() => {
    const start = rule.getQueryRangeStartUnixTimestamp();
    if (start === null) {
      return;
    }

    logger.info(`[${ruleConfig.name}](state: polling|start: ${start}|int: ${Date.now() - start}|query: ${ruleConfig.logql})`);

    try {
      const { logs } = await lokiApi.queryRangeStream<string>(ruleConfig.logql, {
        start
      });

      const createAlert = await rule.walkOnLogs(logs);
      if (createAlert) {
        createRuleAlert(rule.getAlertFormattedRule(), ruleConfig, logger);
        rule.clearLabels();
      }
    }
    catch (error) {
      logger.error(`[${ruleConfig.name}](error: ${error.message})`);
      logger.debug(error);

      handleAgentFailure(error.message, rule, logger);
    }
  });

  return task;
}
