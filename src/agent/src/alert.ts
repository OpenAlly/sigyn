// Import Third-party Dependencies
import dayjs from "dayjs";

// Import Third-party Dependencies
import { SigynRule, getConfig } from "@sigyn/config";

// Import Internal Dependencies
import { DbRule, getDB } from "./database";
import { Notifier } from "./notifier";
import { Logger } from ".";

export function createAlert(rule: DbRule, ruleConfig: SigynRule, logger: Logger) {
  const notifier = Notifier.getSharedInstance(logger);
  const ruleNotifiers = ruleConfig.notifiers ?? [];
  const globalNotifiers = Object.keys(getConfig().notifiers);
  const notifierNames = ruleNotifiers.length > 0 ? ruleNotifiers : globalNotifiers;

  getDB().prepare("INSERT INTO alerts (ruleId, createdAt) VALUES (?, ?)").run(
    rule.id,
    dayjs().unix()
  );

  for (const notifierName of notifierNames) {
    notifier.sendAlert({ rule, notifier: notifierName });
  }
}
