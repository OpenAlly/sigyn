// Import Third-party Dependencies
import { getConfig } from "@sigyn/config";
import { StreamSelector } from "@sigyn/logql";

// Import Internal Dependencies
import { DbAgentFailure, DbAlert, DbAlertNotif, DbNotifier, DbRule, getDB } from "./database";
import { NotifierQueue } from "./notifierQueue";
import * as utils from "./utils/index";
import { Logger } from ".";
import { getAgentFailureRules } from "./utils/selfMonitoring";

// CONSTANTS
const kPrivateInstancier = Symbol("instancier");
const kAgentFailureSeverity = "critical";

export interface NotifierAlert {
  rule: DbRule & { labels: Record<string, string>; oldestLabelTimestamp: number | null };
  notifier: string;
  notif: Pick<DbAlertNotif, "alertId" | "notifierId">;
  error?: Error;
}

export interface AgentFailureAlert {
  failures: DbAgentFailure[];
  notifier: string;
}

export class Notifier {
  static localPackages = new Set([
    "discord",
    "slack",
    "teams"
  ]);

  /**
   * This is the global notifier.
   * We don't want a notifier per rule but a global notifier shared with each rules.
   */
  private static shared: Notifier;

  #queue = new NotifierQueue();
  #logger: Logger;
  #notifiersId = new Map<string, number>();

  constructor(logger: Logger, instancier: symbol) {
    if (instancier !== kPrivateInstancier) {
      throw new Error("Cannot instanciate NotifierQueue, use NotifierQueue.getSharedInstance instead");
    }

    this.#logger = logger;
    this.#queue.on(
      NotifierQueue.DEQUEUE,
      (notificationAlerts: NotifierAlert[]) => this.#sendNotifications(notificationAlerts)
    );
  }

  static getSharedInstance(logger: Logger): Notifier {
    this.shared ??= new Notifier(logger, kPrivateInstancier);

    return this.shared;
  }

  sendAlerts(alerts: Omit<NotifierAlert, "notif">[]) {
    const db = getDB();
    const notificationAlerts: NotifierAlert[] = [];

    for (const alert of alerts) {
      const { id: alertId } = db
        .prepare("SELECT id from alerts WHERE ruleId = ?")
        .get(alert.rule.id) as Pick<DbAlert, "id">;
      const notifierId = this.#databaseNotifierId(alert.notifier);

      notificationAlerts.push({ ...alert, notif: { alertId, notifierId } });
    }

    const insertAlertNotifs = db.prepare("INSERT INTO alertNotifs (alertId, notifierId) VALUES (?, ?)");
    db.transaction(() => {
      for (const { notif } of notificationAlerts) {
        insertAlertNotifs.run(notif.alertId, notif?.notifierId);
      }
    })();

    this.#queue.push(...notificationAlerts);
  }

  sendAgentFailureAlerts(alerts: AgentFailureAlert[]) {
    this.#queue.push(...alerts);
  }

  async #sendNotifications(notificationAlerts: (NotifierAlert | AgentFailureAlert)[]) {
    await Promise.allSettled(
      notificationAlerts.map((alert) => this.#sendNotification(alert))
    );
  }

  async #sendNotification(alert: NotifierAlert | AgentFailureAlert) {
    const { notifier } = alert;
    const rule = "rule" in alert ? alert.rule : null;
    const db = getDB();
    const config = getConfig();
    const notifierConfig = config.notifiers[notifier]!;

    const ruleConfig = rule ? config.rules.find((configRule) => configRule.name === rule.name)! : null;
    const ruleTemplate = ruleConfig?.alert.template;
    if (rule && typeof ruleTemplate === "string") {
      ruleConfig!.alert.template = config.templates![ruleTemplate]!;
    }

    const notifierOptions = {
      ...notifierConfig,
      // eslint-disable-next-line max-len
      template: rule ? ruleTemplate : config.selfMonitoring!.template,
      data: {
        ruleConfig,
        counter: rule ? rule.threshold : null,
        label: rule ? { ...new StreamSelector(ruleConfig!.logql).kv(), ...rule.labels } : null,
        agentFailure: rule ? null : {
          errors:
            (alert as AgentFailureAlert).failures.reduce((pre, { message }) => (pre ? `${pre}, ${message}` : message), ""),
          rules: getAgentFailureRules(alert as AgentFailureAlert)
        },
        severity: rule ? ruleConfig!.alert.severity : kAgentFailureSeverity,
        lokiUrl: rule ? await utils.getLokiUrl(rule, ruleConfig!) : null
      }
    };
    const notifierPackage = Notifier.localPackages.has(notifier) ? `@sigyn/${notifier}` : notifier;

    try {
      const notifier = await import(notifierPackage);
      await notifier.execute(notifierOptions);
      if (!rule) {
        this.#queue.done();
        this.#logger.info(`[SELF-MONITORING](notify: success|notifier: ${alert.notifier})`);

        return;
      }

      db.prepare("UPDATE alertNotifs SET status = ? WHERE alertId = ?").run(
        "success", (alert as NotifierAlert).notif.alertId
      );

      this.#logger.info(`[${rule.name}](notify: success|notifier: ${alert.notifier})`);
    }
    catch (error) {
      db.prepare("UPDATE alertNotifs SET status = ? WHERE alertId = ?").run(
        "failed", (alert as NotifierAlert).notif.alertId
      );

      const identifier = rule ? rule.name : "SELF-MONITORING";
      this.#logger.error(`[${identifier}](notify: error|notifier: ${alert.notifier}|message: ${error.message})`);
    }
    finally {
      this.#queue.done();
    }
  }

  #databaseNotifierId(notifier: string) {
    if (this.#notifiersId.has(notifier)) {
      return this.#notifiersId.get(notifier)!;
    }

    const db = getDB();
    const dbNotifier = db.prepare("SELECT id FROM notifiers WHERE name = ?").get(notifier) as Pick<DbNotifier, "id">;

    if (dbNotifier) {
      this.#notifiersId.set(notifier, dbNotifier.id);

      return dbNotifier.id;
    }

    const { lastInsertRowid } = db.prepare("INSERT INTO notifiers (name) VALUES (?)").run(notifier);
    this.#notifiersId.set(notifier, Number(lastInsertRowid));

    return Number(lastInsertRowid);
  }
}
