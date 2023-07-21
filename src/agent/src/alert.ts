// Import Third-party Dependencies
import dayjs from "dayjs";
import { Logger } from "pino";

// Import Internal Dependencies
import { DbRule, getDB } from "./database";
import { Notifier } from "./notifier";
import { SigynNotifiers, SigynRule, getConfig } from "./config";

export function createAlert(rule: DbRule, config: SigynRule, logger: Logger) {
  const notifier = Notifier.getNotifier(logger);
  const rulegNotifiers = config.notifiers ?? [];
  const globalNotifiers = Object.keys(getConfig().notifiers) as (keyof SigynNotifiers)[];
  const notifierNames = rulegNotifiers.length > 0 ? rulegNotifiers : globalNotifiers;

  for (const notifierName of notifierNames) {
    notifier.sendAlert({ rule, notifier: notifierName });
  }

  getDB().prepare("INSERT INTO alerts (ruleId, createdAt) VALUES (?, ?)").run(
    rule.id,
    dayjs().unix()
  );
}
