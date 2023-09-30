// Import Third-party Dependencies
import dayjs from "dayjs";

// Import Third-party Dependencies
import { SigynRule, SigynSelfMonitoring, getConfig } from "@sigyn/config";

// Import Internal Dependencies
import { DbAgentFailure, getDB } from "./database";
import { Notifier, NotifierAlert } from "./notifier";
import { Logger } from ".";

export function createRuleAlert(
  rule: NotifierAlert["rule"],
  ruleConfig: SigynRule,
  logger: Logger
) {
  const notifier = Notifier.getSharedInstance(logger);

  getDB().prepare("INSERT INTO alerts (ruleId, createdAt) VALUES (?, ?)").run(
    rule.id,
    dayjs().valueOf()
  );
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
  const notifier = Notifier.getSharedInstance(logger);
  const { notifiers } = getConfig();

  notifier.sendAgentFailureAlerts(
    config.notifiers.map((notifierName) => {
      return { failures, notifierConfig: notifiers[notifierName] };
    })
  );
}
