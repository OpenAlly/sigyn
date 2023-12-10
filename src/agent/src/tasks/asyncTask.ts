// Import Node.js Dependencies
import { performance } from "node:perf_hooks";

// Import Third-party Dependencies
import { SigynInitializedRule } from "@sigyn/config";
import { GrafanaApi } from "@myunisoft/loki";
import { AsyncTask } from "toad-scheduler";
import ms from "ms";

// Import Internal Dependencies
import { Rule } from "../rules";
import { Logger } from "..";
import { createRuleAlert } from "../alert";
import { handleAgentFailure } from "../utils/selfMonitoring";

export interface AsyncTaskOptions {
  logger: Logger;
  rule: Rule;
  lokiApi: GrafanaApi;
}

export function asyncTask(ruleConfig: SigynInitializedRule, options: AsyncTaskOptions) {
  const { rule, logger, lokiApi } = options;

  const task = new AsyncTask(ruleConfig.name, async() => {
    const start = rule.getQueryRangeStartUnixTimestamp();
    if (start === null) {
      return;
    }

    logger.info(`[${ruleConfig.name}](state: polling|start: ${start}|int: ${Date.now() - start}|query: ${ruleConfig.logql})`);

    const t0 = performance.now();
    try {
      const { logs } = await lokiApi.Loki.queryRangeStream<string>(ruleConfig.logql, {
        start
      });
      const logsCount = logs.reduce((acc, curr) => acc + curr.values.length, 0);
      logger.info(`[${ruleConfig.name}](logs: ${logsCount}|execTime: ${ms(performance.now() - t0)})`);

      const createAlertResult = rule.walkOnLogs(logs);
      if (createAlertResult.ok) {
        createRuleAlert(rule.getAlertFormattedRule(), ruleConfig, logger);
        rule.clearLabels();
      }
      else {
        logger.debug(`[${ruleConfig.name}](debug: ${createAlertResult.val})`);
      }
    }
    catch (error) {
      logger.error(`[${ruleConfig.name}](error: ${error.message}|execTime: ${ms(performance.now() - t0)})`);
      logger.debug(error);

      handleAgentFailure(error.message, rule, logger);
    }
  });

  return task;
}
