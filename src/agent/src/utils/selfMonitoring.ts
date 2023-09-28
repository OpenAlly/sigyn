// Import Third-party Dependencies
import { SigynSelfMonitoring } from "@sigyn/config";

// Import Internal Dependencies
import { getDB } from "../database";
import { AgentFailureAlert } from "../notifier";
import * as cronUtils from "./cron";

export function checkAgentFailureThrottle(throttle: SigynSelfMonitoring["throttle"]) {
  if (!throttle) {
    return false;
  }

  const { interval, count = 0 } = throttle;

  const intervalDate = cronUtils.durationOrCronToDate(interval, "subtract").valueOf();
  const agentFailuresCount = getDB().prepare("SELECT * FROM agentFailures WHERE timestamp <= ?").all(
    intervalDate
  ).length;

  return agentFailuresCount <= count;
}

export function getAgentFailureRules(alert: AgentFailureAlert): string {
  const ruleIds = new Set(alert.failures.map(({ ruleId }) => ruleId));
  const failures = getDB().prepare("SELECT name FROM rules WHERE id IN (?)").all([...ruleIds]) as { name: string }[];

  return failures.map(({ name }) => name).join(", ");
}
