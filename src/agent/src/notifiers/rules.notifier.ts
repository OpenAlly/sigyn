// Import Node.js Dependencies
import assert from "node:assert";

// Import Third-party Dependencies
import { getConfig } from "@sigyn/config";
import { StreamSelector } from "@sigyn/logql";

// Import Internal Dependencies
import { Logger } from "..";
import { DbRule, DbAlertNotif, DbAlert, DbNotifier } from "../database";
import { Alert, Notifier } from "./notifier";
import * as utils from "../utils";

// CONSTANTS
const kIdentifier = Symbol("ruleNotifier");

export interface RuleNotifierAlert extends Alert {
  rule: DbRule & { labels: Record<string, string>; oldestLabelTimestamp: number | null };
  notif: Pick<DbAlertNotif, "alertId" | "notifierId">;
  error?: Error;
}

export class RuleNotifier extends Notifier<RuleNotifierAlert> {
  private static shared: RuleNotifier;

  #notifiersId = new Map<string, number>();

  constructor(logger: Logger, identifier: symbol) {
    if (identifier !== kIdentifier) {
      throw new Error("Cannot instanciate RuleNotifier, use RuleNotifier.getSharedInstance instead");
    }

    super(logger, kIdentifier);
  }

  static getSharedInstance(logger: Logger): RuleNotifier {
    this.shared ??= new RuleNotifier(logger, kIdentifier);

    return this.shared;
  }

  sendAlerts(alerts: Omit<RuleNotifierAlert, "notif">[]) {
    const notificationAlerts: RuleNotifierAlert[] = [];

    for (const alert of alerts) {
      const { id: alertId } = this.db
        .prepare("SELECT id from alerts WHERE ruleId = ?")
        .get(alert.rule.id) as Pick<DbAlert, "id">;
      const notifierId = this.#databaseNotifierId(alert.notifierConfig.notifier);

      notificationAlerts.push({ ...alert, notif: { alertId, notifierId } });
    }

    const insertAlertNotifs = this.db.prepare("INSERT INTO alertNotifs (alertId, notifierId) VALUES (?, ?)");
    this.db.transaction(() => {
      for (const { notif } of notificationAlerts) {
        insertAlertNotifs.run(notif.alertId, notif?.notifierId);
      }
    })();

    this.push(notificationAlerts);
  }

  nonUniqueMatcher(notification: RuleNotifierAlert, newNotifications: RuleNotifierAlert) {
    function isDeepStrictEqual(a: unknown, b: unknown): boolean {
      try {
        assert.deepEqual(a, b);

        return true;
      }
      catch {
        return false;
      }
    }

    return notification.rule.name === newNotifications.rule.name &&
      isDeepStrictEqual(notification.rule.labels, newNotifications.rule.labels);
  }

  async sendNotification(alert: RuleNotifierAlert) {
    const { notifierConfig, rule } = alert;
    const ruleConfig = this.config.rules.find((configRule) => configRule.name === rule.name)!;

    const notifierOptions = {
      ...notifierConfig,
      data: await this.#notiferAlertData(alert),
      template: ruleConfig!.alert.template
    };

    try {
      await this.execute(notifierOptions);

      this.logger.info(`[${rule.name}](notify: success|notifier: ${notifierConfig.notifier})`);

      this.db
        .prepare("UPDATE alertNotifs SET status = ? WHERE alertId = ?")
        .run("success", alert.notif.alertId);
    }
    catch (error) {
      this.db
        .prepare("UPDATE alertNotifs SET status = ? WHERE alertId = ?")
        .run("failed", alert.notif.alertId);

      this.logger.error(`[${rule.name}](notify: error|notifier: ${notifierConfig.notifier}|message: ${error.message})`);
    }
  }

  #databaseNotifierId(notifier: string) {
    if (this.#notifiersId.has(notifier)) {
      return this.#notifiersId.get(notifier)!;
    }

    const dbNotifier = this.db
      .prepare("SELECT id FROM notifiers WHERE name = ?")
      .get(notifier) as Pick<DbNotifier, "id">;

    if (dbNotifier) {
      this.#notifiersId.set(notifier, dbNotifier.id);

      return dbNotifier.id;
    }

    const { lastInsertRowid } = this.db
      .prepare("INSERT INTO notifiers (name) VALUES (?)")
      .run(notifier);
    this.#notifiersId.set(notifier, Number(lastInsertRowid));

    return Number(lastInsertRowid);
  }

  async #notiferAlertData(alert: RuleNotifierAlert) {
    const { rule } = alert;
    const ruleConfig = getConfig().rules.find((configRule) => configRule.name === rule.name)!;

    return {
      ruleConfig,
      ruleName: rule.name,
      count: rule.counter,
      counter: rule.threshold,
      threshold: ruleConfig.alert.on.count,
      interval: ruleConfig.alert.on.interval,
      label: { ...new StreamSelector(ruleConfig.logql).kv(), ...rule.labels },
      severity: ruleConfig.alert.severity,
      lokiUrl: await utils.getLokiUrl(rule, ruleConfig)
    };
  }
}
