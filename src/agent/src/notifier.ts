// Import Node.js Dependencies
import EventEmitter from "node:events";

// Import Internal Dependencies
import { getDB } from "./database";
import { NOTIFIER_QUEUE_EVENTS, NotifierQueue } from "./notifierQueue";
import { DbAlert, DbAlertNotif, DbNotifier, DbRule } from "./types";
import { getConfig } from "./config";
import { discord } from "./discord";

// CONSTANTS
const kPrivateInstancier = Symbol("instancier");

export const NOTIFIER_EVENTS = {
  ALERT: Symbol("alert"),
  SUCCESS: (ruleName: string) => `${ruleName}:success`,
  ERROR: (ruleName: string) => `${ruleName}:error`
};

export interface NotifierAlert {
  rule: DbRule;
  notifier: string;
  notif: Pick<DbAlertNotif, "alertId" | "notifierId">;
  error?: Error;
}

/**
 * This is the global notifier.
 * We don't want a notifier rule but a global notifier shared with each rules.
 */
let notifier: Notifier;

export class Notifier extends EventEmitter {
  #queue: NotifierQueue;

  constructor(instancier: symbol) {
    if (instancier !== kPrivateInstancier) {
      throw new Error("Cannot instanciate NotifierQueue, use NotifierQueue.getNotifier instead");
    }

    super();

    this.#queue = new NotifierQueue();

    // TODO CONSTANTS
    this.on(NOTIFIER_EVENTS.ALERT, (alert) => this.#onNewAlert(alert));
    this.#queue.on(NOTIFIER_QUEUE_EVENTS.DEQUEUE, (alert) => this.#sendNotifications(alert));
  }

  static getNotifier(): Notifier {
    if (notifier === undefined) {
      notifier = new Notifier(kPrivateInstancier);
    }

    return notifier;
  }

  #onNewAlert(alert: NotifierAlert) {
    const db = getDB();
    const { id: alertId } = db
      .prepare("SELECT id from alerts WHERE ruleId = ?")
      .get(alert.rule.id) as Pick<DbAlert, "id">;
    const notifierId = this.#databaseNotifierId(alert.notifier);

    db.prepare("INSERT INTO alertNotifs (alertId, notifierId) VALUES (?, ?)").run(alertId, notifierId);

    alert.notif = { alertId, notifierId };
    this.#queue.push(alert);
  }

  async #sendNotifications(alerts: NotifierAlert[]) {
    await Promise.all(alerts.map((alert) => this.#sendNotification(alert)));
  }

  async #sendNotification(alert: NotifierAlert) {
    const { notifier } = alert;

    const config = getConfig();
    const ruleConfig = config.rules.find((rule) => rule.name === alert.rule.name);
    const notifierConfig = config.notifiers[notifier];

    try {
      switch (notifier) {
        case "discord":
          await discord.executeWebhook({ ...notifierConfig, ruleConfig, rule: alert.rule });
          break;

        default:
          throw new Error(`Unknown notifier: ${notifier}`);
      }

      this.#queue.emit(NOTIFIER_QUEUE_EVENTS.DONE);
      this.emit(NOTIFIER_EVENTS.SUCCESS(alert.rule.name), alert);
    }
    catch (error) {
      alert.error = error;
      this.emit(NOTIFIER_EVENTS.ERROR(alert.rule.name), alert);
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
