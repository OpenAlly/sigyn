// Import Third-party Dependencies
import { SigynRule, SigynSelfMonitoring, getConfig } from "@sigyn/config";

// Import Internal Dependencies
import { DbAgentFailure, getDB } from "./database";
import { Logger } from ".";
import { handleCompositeRules } from "./compositeRules";
import { RuleNotifier, RuleNotifierAlert } from "./notifiers/rules.notifier";
import { AgentFailureNotifier } from "./notifiers/agentFailure.notifier";

export function createRuleAlert(
  rule: RuleNotifierAlert["rule"],
  ruleConfig: SigynRule,
  logger: Logger
) {
  const notifier = RuleNotifier.getSharedInstance(logger);

  const { lastInsertRowid } = getDB().prepare("INSERT INTO alerts (ruleId, createdAt) VALUES (?, ?)").run(
    rule.id,
    Date.now()
  );

  handleCompositeRules(logger);

  if (rule.labels) {
    const insertAlertLabels = getDB().prepare("INSERT INTO alertLabels (alertId, key, value) VALUES (?, ?, ?)");

    getDB().transaction(() => {
      for (const [key, value] of Object.entries(rule.labels)) {
        insertAlertLabels.run(lastInsertRowid, key, value);
      }
    })();
  }

  const { notifiers } = getConfig();

  notifier.sendAlerts(
    ruleConfig.notifiers.map((notifierName) => {
      return { rule, notifierConfig: notifiers[notifierName] };
    })
  );
}

export function createAgentFailureAlert(
  failures: DbAgentFailure[],
  config: SigynSelfMonitoring,
  logger: Logger
) {
  const notifier = AgentFailureNotifier.getSharedInstance(logger);
  const { notifiers } = getConfig();

  notifier.sendAlerts(
    config.notifiers.map((notifierName) => {
      return { failures, notifierConfig: notifiers[notifierName] };
    })
  );
}
