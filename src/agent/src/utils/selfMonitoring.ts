// Import Third-party Dependencies
import { SigynInitializedSelfMonitoring, getConfig } from "@sigyn/config";

// Import Internal Dependencies
import { DbAgentFailure, getDB } from "../database";
import * as cronUtils from "./cron";
import { Rule } from "../rules";
import { Logger } from "..";
import { createAgentFailureAlert } from "../alert";
import { AgentFailureAlert } from "../notifiers/agentFailure.notifier";

export function getAgentFailureRules(alert: AgentFailureAlert): string {
  const ruleIds = new Set(alert.failures.map(({ ruleId }) => ruleId));
  const failures = getDB()
    .prepare(`SELECT name FROM rules WHERE id IN (${[...ruleIds].map(() => "?").join(",")})`)
    .all([...ruleIds]) as { name: string }[];

  return failures.map(({ name }) => name).join(", ");
}

function hasAgentFailureThrottle(throttle: SigynInitializedSelfMonitoring["throttle"]) {
  if (!throttle) {
    return false;
  }

  const { interval, count, activationThreshold } = throttle;

  const intervalDate = cronUtils.durationOrCronToDate(interval, "subtract").valueOf();
  const agentFailuresAlert = (getDB()
    .prepare("SELECT count FROM agentFailures WHERE timestamp >= ? ORDER BY count DESC")
    .get(intervalDate) as { count: number });
  const agentFailuresAlertCount = agentFailuresAlert?.count ?? 0;

  if (activationThreshold > 0 && agentFailuresAlertCount <= activationThreshold) {
    return false;
  }

  if (count > 0 && agentFailuresAlertCount - activationThreshold > count) {
    return false;
  }

  if (activationThreshold > 0 && agentFailuresAlertCount > activationThreshold) {
    return true;
  }

  return agentFailuresAlertCount === 1 ? false : agentFailuresAlertCount - activationThreshold <= count;
}

export function handleAgentFailure(errorMessage: string, rule: Rule, logger: Logger) {
  const config = getConfig();
  if (!config.selfMonitoring) {
    logger.info("[SELF MONITORING](skip: disabled)");

    return;
  }
  const { errorFilters, ruleFilters, minimumErrorCount = 0 } = config.selfMonitoring;

  if (errorFilters && !errorFilters?.includes(errorMessage)) {
    logger.info(`[SELF MONITORING](skip: error message "${errorMessage}" is not in errorFilters)`);

    return;
  }

  if (ruleFilters && !ruleFilters?.includes(rule.config.name)) {
    logger.info(`[SELF MONITORING](skip: rule "${rule.config.name}" is not in ruleFilters)`);

    return;
  }

  try {
    const dbRule = rule.getRuleFromDatabase();
    getDB().exec("UPDATE agentFailures SET count = count + 1");
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
        logger.info(`[SELF MONITORING](skip: throttle is activated)`);

        return;
      }

      logger.info(`[SELF MONITORING](new alert: ${agentFailures.length} agent failures detected)`);

      createAgentFailureAlert(agentFailures, config.selfMonitoring, logger);

      // delete all agentFailures, if there is throttle: delete only the old ones
      const { interval } = config.selfMonitoring.throttle ?? {};
      const intervalDate = interval ?
        cronUtils.durationOrCronToDate(interval, "subtract").valueOf() :
        Date.now();
      getDB().prepare("DELETE FROM agentFailures WHERE timestamp < ?").run(intervalDate);
    }
  }
  catch (error) {
    logger.error(`[SELF MONITORING](error: ${error.message})`);
  }
}
