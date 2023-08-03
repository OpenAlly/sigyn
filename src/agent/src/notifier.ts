// Import Third-party Dependencies
import { getConfig } from "@sigyn/config";

// Import Internal Dependencies
import { DbAlert, DbAlertNotif, DbNotifier, DbRule, getDB } from "./database";
import { NOTIFIER_QUEUE_EVENTS, NotifierQueue } from "./notifierQueue";
import * as utils from "./utils";
import { Logger } from ".";

// CONSTANTS
const kPrivateInstancier = Symbol("instancier");

export interface NotifierAlert {
  rule: DbRule;
  notifier: string;
  notif: Pick<DbAlertNotif, "alertId" | "notifierId">;
  error?: Error;
}

/**
 * This is the global notifier.
 * We don't want a notifier per rule but a global notifier shared with each rules.
 */
let notifier: Notifier;

export class Notifier {
  #queue = new NotifierQueue();
  #logger: Logger;

  constructor(logger: Logger, instancier: symbol) {
    if (instancier !== kPrivateInstancier) {
      throw new Error("Cannot instanciate NotifierQueue, use NotifierQueue.getNotifier instead");
    }

    this.#logger = logger;
    this.#queue.on(NOTIFIER_QUEUE_EVENTS.DEQUEUE, (alert) => this.#sendNotifications(alert));
  }

  static getNotifier(logger: Logger): Notifier {
    if (notifier === undefined) {
      notifier = new Notifier(logger, kPrivateInstancier);
    }

    return notifier;
  }

  sendAlert(alert: Omit<NotifierAlert, "notif">) {
    const db = getDB();
    const { id: alertId } = db
      .prepare("SELECT id from alerts WHERE ruleId = ?")
      .get(alert.rule.id) as Pick<DbAlert, "id">;
    const notifierId = this.#databaseNotifierId(alert.notifier);

    db.prepare("INSERT INTO alertNotifs (alertId, notifierId) VALUES (?, ?)").run(alertId, notifierId);

    this.#queue.push({ ...alert, notif: { alertId, notifierId } });
  }

  async #sendNotifications(alerts: NotifierAlert[]) {
    await Promise.allSettled(alerts.map((alert) => this.#sendNotification(alert)));
  }

  async #sendNotification(alert: NotifierAlert) {
    const { notifier } = alert;

    const db = getDB();
    const config = getConfig();
    const ruleConfig = config.rules.find((rule) => rule.name === alert.rule.name)!;
    const notifierConfig = config.notifiers[notifier]!;

    const ruleTemplate = ruleConfig.alert.template;
    if (typeof ruleTemplate === "string") {
      ruleConfig.alert.template = config.templates[ruleTemplate]!;
    }

    const notifierOptions = { ...notifierConfig, ruleConfig, counter: alert.rule.counter };
    const notifierPackage = utils.getNotifierPackage(notifier);

    try {
      const notifier = await import(notifierPackage);
      await notifier.execute(notifierOptions);

      db.prepare("UPDATE alertNotifs SET status = ? WHERE alertId = ?").run(
        "success", alert.notif.alertId
      );

      this.#logger.info(`[${alert.rule.name}](notify: success|notifier: ${alert.notifier})`);
    }
    catch (error) {
      db.prepare("UPDATE alertNotifs SET status = ? WHERE alertId = ?").run(
        "failed", alert.notif.alertId
      );

      this.#logger.error(`[${alert.rule.name}](notify: error|notifier: ${alert.notifier}|message: ${error.message})`);
    }
    finally {
      this.#queue.emit(NOTIFIER_QUEUE_EVENTS.DONE);
    }
  }

  #databaseNotifierId(notifier: string) {
    const db = getDB();
    const dbNotifier = db.prepare("SELECT id FROM notifiers WHERE name = ?").get(notifier) as Pick<DbNotifier, "id">;

    if (dbNotifier) {
      return dbNotifier.id;
    }

    const { lastInsertRowid } = db.prepare("INSERT INTO notifiers (name) VALUES (?)").run(notifier);

    return lastInsertRowid as number;
  }
}
