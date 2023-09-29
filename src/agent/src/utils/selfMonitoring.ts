// Import Third-party Dependencies
import { SigynSelfMonitoring, getConfig } from "@sigyn/config";

// Import Internal Dependencies
import { DbAgentFailure, getDB } from "../database";
import { AgentFailureAlert } from "../notifier";
import * as cronUtils from "./cron";
import { Rule } from "../rules";
import { Logger } from "..";
import { createAgentFailureAlert } from "../alert";

export function getAgentFailureRules(alert: AgentFailureAlert): string {
  const ruleIds = new Set(alert.failures.map(({ ruleId }) => ruleId));
  const failures = getDB()
    .prepare("SELECT name FROM rules WHERE id IN (?)")
    .all([...ruleIds]) as { name: string }[];

  return failures.map(({ name }) => name).join(", ");
}

function hasAgentFailureThrottle(throttle: SigynSelfMonitoring["throttle"]) {
  if (!throttle) {
    return false;
  }

  const { interval, count = 0 } = throttle;

  const intervalDate = cronUtils.durationOrCronToDate(interval, "subtract").valueOf();
  const agentFailuresCount = getDB()
    .prepare("SELECT * FROM agentFailures WHERE timestamp <= ?")
    .all(intervalDate)
    .length;

  return agentFailuresCount <= count;
}

export function handleAgentFailure(errorMessage: string, rule: Rule, logger: Logger) {
  const config = getConfig();
  if (!config.selfMonitoring) {
    return;
  }
  const { errorFilters, ruleFilters, minimumErrorCount = 0 } = config.selfMonitoring;

  if (errorFilters && !errorFilters?.includes(errorMessage)) {
    return;
  }

  if (ruleFilters && !ruleFilters?.includes(rule.config.name)) {
    return;
  }

  try {
    const dbRule = rule.getRuleFromDatabase();
    getDB()
      .prepare("INSERT INTO agentFailures (ruleId, message, timestamp) VALUES (?, ?, ?)")
      .run(
        dbRule.id,
        errorMessage,
        Date.now()
      );

    const agentFailures = getDB().prepare("SELECT * FROM agentFailures").all() as DbAgentFailure[];
    if (agentFailures.length > minimumErrorCount) {
      if (hasAgentFailureThrottle(config.selfMonitoring.throttle)) {
        return;
      }

      createAgentFailureAlert(agentFailures, config.selfMonitoring, logger);
      getDB().prepare("DELETE FROM agentFailures").run();
    }
  }
  catch (error) {
    logger.error(`[SELF MONITORING](error: ${error.message})`);
  }
}
