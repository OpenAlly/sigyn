// Import Third-party Dependencies
import { getConfig, SigynInitializedRule } from "@sigyn/config";
import { GrafanaLoki } from "@myunisoft/loki";
import { AsyncTask } from "toad-scheduler";

// Import Internal Dependencies
import { Rule } from "../rules";
import { Logger } from "..";
import { createAgentFailureAlert, createRuleAlert } from "../alert";
import { DbAgentFailure, getDB } from "../database";
import { checkAgentFailureThrottle } from "../utils/selfMonitoring";

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

    try {
      const { logs } = await lokiApi.queryRangeStream<string>(ruleConfig.logql, {
        start
      });
      logger.info(`[${ruleConfig.name}](state: polling|start: ${start}|end: ${Date.now()}|query: ${ruleConfig.logql})`);

      const createAlert = await rule.walkOnLogs(logs);
      if (createAlert) {
        createRuleAlert(rule.getAlertFormattedRule(), ruleConfig, logger);
        rule.clearLabels();
      }
    }
    catch (e) {
      logger.error(`[${ruleConfig.name}](error: ${e.message})`);

      const config = getConfig();
      if (!config.selfMonitoring) {
        return;
      }
      const { errorFilters, ruleFilters, minimumErrorCount = 0 } = config.selfMonitoring;

      if (errorFilters && !errorFilters?.includes(e.message)) {
        return;
      }

      if (ruleFilters && !ruleFilters?.includes(ruleConfig.name)) {
        return;
      }

      try {
        const dbRule = rule.getRuleFromDatabase();
        getDB().prepare("INSERT INTO agentFailures (ruleId, message, timestamp) VALUES (?, ?, ?)").run(
          dbRule.id,
          e.message,
          Date.now()
        );

        const agentFailures = getDB().prepare("SELECT * FROM agentFailures").all() as DbAgentFailure[];
        if (agentFailures.length > minimumErrorCount) {
          if (checkAgentFailureThrottle(config.selfMonitoring.throttle)) {
            return;
          }

          createAgentFailureAlert(agentFailures, config.selfMonitoring, logger);
          getDB().prepare("DELETE FROM agentFailures").run();
        }
      }
      catch (err) {
        logger.error(`[SELF MONITORING](error: ${err.message})`);
      }
    }
  });

  return task;
}
