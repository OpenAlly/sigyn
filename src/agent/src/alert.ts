// Import Third-party Dependencies
import dayjs from "dayjs";

// Import Third-party Dependencies
import { SigynRule } from "@sigyn/config";

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

  getDB().prepare("INSERT INTO alerts (ruleId, createdAt) VALUES (?, ?)").run(
    rule.id,
    dayjs().valueOf()
  );

  notifier.sendAlerts(
    ruleConfig.notifiers.map((notifierName) => {
      return { rule, notifier: notifierName };
    })
  );
}
