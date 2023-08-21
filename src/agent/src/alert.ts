// Import Third-party Dependencies
import dayjs from "dayjs";

// Import Third-party Dependencies
import { SigynRule, getConfig } from "@sigyn/config";

// Import Internal Dependencies
import { getDB } from "./database";
import { Notifier, NotifierAlert } from "./notifier";
import { Logger } from ".";

export function createRuleAlert(
  rule: NotifierAlert["rule"],
  ruleConfig: SigynRule,
  logger: Logger
) {
  const notifier = Notifier.getSharedInstance(logger);
  const ruleNotifiers = ruleConfig.notifiers ?? [];
  const globalNotifiers = Object.keys(getConfig().notifiers);
  const notifierNames = ruleNotifiers.length > 0 ? ruleNotifiers : globalNotifiers;

  getDB().prepare("INSERT INTO alerts (ruleId, createdAt) VALUES (?, ?)").run(
    rule.id,
    dayjs().valueOf()
  );

  for (const notifierName of notifierNames) {
    notifier.sendAlert({ rule, notifier: notifierName });
  }
}
