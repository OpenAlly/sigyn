// Import Third-party Dependencies
import dayjs from "dayjs";
import { SigynRule, SigynSelfMonitoring, getConfig } from "@sigyn/config";

// Import Internal Dependencies
import { DbAgentFailure, getDB } from "./database";
import { Notifier, NotifierAlert } from "./notifier";
import { Logger } from ".";
import { handleCompositeRules } from "./compositeRules";

export function createRuleAlert(
  rule: NotifierAlert["rule"],
  ruleConfig: SigynRule,
  logger: Logger
) {
  const notifier = Notifier.getSharedInstance(logger);

  const { lastInsertRowid } = getDB().prepare("INSERT INTO alerts (ruleId, createdAt) VALUES (?, ?)").run(
    rule.id,
    dayjs().valueOf()
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

  notifier.sendRuleAlerts(
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
  const notifier = Notifier.getSharedInstance(logger);
  const { notifiers } = getConfig();

  notifier.sendAgentFailureAlerts(
    config.notifiers.map((notifierName) => {
      return { failures, notifierConfig: notifiers[notifierName] };
    })
  );
}
