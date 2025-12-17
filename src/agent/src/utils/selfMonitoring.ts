// Import Third-party Dependencies
import { type SigynInitializedSelfMonitoring, getConfig } from "@sigyn/config";
import { Result, Ok, Err } from "@openally/result";

// Import Internal Dependencies
import { type DbAgentFailure, getDB } from "../database.ts";
import * as cronUtils from "./cron.ts";
import { Rule } from "../rules.ts";
import { type Logger } from "../index.ts";
import { createAgentFailureAlert } from "../alert.ts";
import { type AgentFailureAlert } from "../notifiers/agentFailure.notifier.ts";

export function getAgentFailureRules(alert: AgentFailureAlert): string {
  const ruleIds = new Set(alert.failures.map(({ ruleId }) => ruleId));
  const failures = getDB()
    .prepare(`SELECT name FROM rules WHERE id IN (${[...ruleIds].map(() => "?").join(",")})`)
    .all([...ruleIds]) as { name: string; }[];

  return failures.map(({ name }) => name).join(", ");
}

function hasAgentFailureThrottle(throttle: SigynInitializedSelfMonitoring["throttle"]): Result<string, string> {
  if (!throttle) {
    return Err("no throttle for the given rule");
  }

  const { interval, count, activationThreshold } = throttle;

  const intervalDate = cronUtils.durationOrCronToDate(interval, "subtract").valueOf();
  const agentFailuresAlert = (getDB()
    .prepare("SELECT count FROM agentFailures WHERE timestamp >= ? ORDER BY count DESC")
    .get(intervalDate) as { count: number; });
  const unprocessedAgentFailuresAlertFromThrottle = (getDB()
    .prepare("SELECT count FROM agentFailures WHERE timestamp <= ? AND processed = 0 ORDER BY count DESC")
    .get(intervalDate) as { count: number; });
  const lastAgentFailureAlert = (getDB()
    .prepare("SELECT * FROM agentFailures ORDER BY count DESC LIMIT 1")
    .get() as DbAgentFailure);

  const agentFailuresAlertCount = agentFailuresAlert?.count ?? 0;
  const unprocessedAgentFailuresAlertCount = unprocessedAgentFailuresAlertFromThrottle?.count ?? 0;
  const countThresholdExceeded = count > 0 && agentFailuresAlertCount - activationThreshold > count;
  const activationThresholdExceeded = activationThreshold > 0 && agentFailuresAlertCount <= activationThreshold;
  const intervalExceeded = lastAgentFailureAlert.processed && lastAgentFailureAlert.timestamp > intervalDate;

  function logMessage(throttle: boolean, details: string) {
    // eslint-disable-next-line @stylistic/max-len
    return `(throttle: ${throttle ? "on" : "off"}|details: ${details}|processed: ${lastAgentFailureAlert.processed}|lastAlertTime: ${lastAgentFailureAlert.timestamp}|activationThreshold: ${activationThreshold}|agentFailuresCount: ${agentFailuresAlertCount}|count: ${count})`;
  }

  if (!activationThresholdExceeded && intervalExceeded && !countThresholdExceeded) {
    return Ok(logMessage(true, "within interval"));
  }
  else if (lastAgentFailureAlert.processed && activationThreshold === 0) {
    return Err(logMessage(false, "interval exceeded"));
  }

  if (unprocessedAgentFailuresAlertCount > 0) {
    return Err(logMessage(false, "failures older than throttle interval"));
  }

  if (activationThresholdExceeded) {
    return Err(logMessage(false, `activation threshold not reached (${agentFailuresAlertCount} <= ${activationThreshold})`));
  }

  if (countThresholdExceeded) {
    return Err(logMessage(false, "count threshold exceeded"));
  }

  if (activationThreshold > 0 && agentFailuresAlertCount > activationThreshold) {
    return Ok(logMessage(true, "failures count > activationThreshold"));
  }

  const hasThrottle = agentFailuresAlertCount === 1 ? false : agentFailuresAlertCount - activationThreshold <= count;

  return hasThrottle ?
    Ok(logMessage(true, "failures count < activationThreshold + count")) :
    Err(logMessage(false, "failures count > activationThreshold + count"));
}

export function handleAgentFailure(errorMessage: string, rule: Rule, logger: Logger) {
  const db = getDB();
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
    db.exec("UPDATE agentFailures SET count = count + 1");
    db
      .prepare("INSERT INTO agentFailures (ruleId, message, timestamp) VALUES (?, ?, ?)")
      .run(
        dbRule.id,
        errorMessage,
        Date.now()
      );

    const agentFailures = db.prepare("SELECT * FROM agentFailures").all() as DbAgentFailure[];
    if (agentFailures.length > minimumErrorCount) {
      const throttle = hasAgentFailureThrottle(config.selfMonitoring.throttle);
      logger.info(`[SELF MONITORING]${throttle.val}`);

      if (throttle.ok) {
        return;
      }

      logger.info(`[SELF MONITORING](new alert: ${agentFailures.length} agent failures detected)`);
      db.exec("UPDATE agentFailures SET processed = 1");

      createAgentFailureAlert(agentFailures, config.selfMonitoring, logger);

      // delete all agentFailures, if there is throttle: delete only the old ones
      const { interval } = config.selfMonitoring.throttle ?? {};
      const intervalDate = interval ?
        cronUtils.durationOrCronToDate(interval, "subtract").valueOf() :
        Date.now();
      db.prepare("DELETE FROM agentFailures WHERE timestamp < ?").run(intervalDate);
    }
  }
  catch (error: any) {
    logger.error(`[SELF MONITORING](error: ${error.message})`);
    logger.debug(error);
  }
}
