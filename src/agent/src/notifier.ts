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
const kCompositeRuleSeverity = "critical";

export interface Alert {
  notifierConfig: {
    notifier: string;
    [key: string]: unknown;
  };
}

export interface NotifierAlert extends Alert {
  rule: DbRule & { labels: Record<string, string>; oldestLabelTimestamp: number | null };
  notif: Pick<DbAlertNotif, "alertId" | "notifierId">;
  error?: Error;
}

export interface AgentFailureAlert extends Alert {
  failures: DbAgentFailure[];
}

export interface CompositeRuleAlert extends Alert {
  compositeRuleName: string;
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

  #queue = new NotifierQueue<Alert>();
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

  sendRuleAlerts(alerts: Omit<NotifierAlert, "notif">[]) {
    const db = getDB();
    const notificationAlerts: NotifierAlert[] = [];

    for (const alert of alerts) {
      const { id: alertId } = db
        .prepare("SELECT id from alerts WHERE ruleId = ?")
        .get(alert.rule.id) as Pick<DbAlert, "id">;
      const notifierId = this.#databaseNotifierId(alert.notifierConfig.notifier);

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

  sendCompositeRuleAlerts(alerts: CompositeRuleAlert[]) {
    this.#queue.push(...alerts);
  }

  async #sendNotifications(notificationAlerts: (NotifierAlert | AgentFailureAlert | CompositeRuleAlert)[]) {
    await Promise.allSettled(
      notificationAlerts.map((alert) => this.#sendNotification(alert))
    );
  }

  async #notiferAlertData(alert: NotifierAlert) {
    const { rule } = alert;
    const ruleConfig = getConfig().rules.find((configRule) => configRule.name === rule.name)!;

    return {
      ruleConfig,
      counter: rule.threshold,
      label: { ...new StreamSelector(ruleConfig.logql).kv(), ...rule.labels },
      severity: ruleConfig.alert.severity,
      lokiUrl: await utils.getLokiUrl(rule, ruleConfig)
    };
  }

  #agentFailureAlertData(alert: AgentFailureAlert) {
    const { failures } = alert;

    return {
      agentFailure: {
        errors: failures.reduce((pre, { message }) => (pre ? `${pre}, ${message}` : message), ""),
        rules: getAgentFailureRules(alert)
      },
      severity: kAgentFailureSeverity
    };
  }

  #compositeRuleAlertData(alert: CompositeRuleAlert) {
    const { compositeRuleName } = alert;

    return {
      // TODO: make it configurable
      severity: kCompositeRuleSeverity,
      compositeRuleName
    };
  }

  async #sendNotification(alert: NotifierAlert | AgentFailureAlert | CompositeRuleAlert) {
    const { notifierConfig } = alert;
    const rule = "rule" in alert ? alert.rule : null;
    const compositeRuleName = "compositeRuleName" in alert ? alert.compositeRuleName : null;
    const db = getDB();
    const config = getConfig();
    const ruleConfig = rule ? config.rules.find((configRule) => configRule.name === rule.name)! : null;

    const notifierOptions = {
      ...notifierConfig
    };
    if (rule) {
      Object.assign(notifierOptions, {
        data: await this.#notiferAlertData(alert as NotifierAlert),
        template: ruleConfig!.alert.template
      });
    }
    else if ("failures" in alert) {
      Object.assign(notifierOptions, {
        data: this.#agentFailureAlertData(alert as AgentFailureAlert),
        template: config.selfMonitoring!.template
      });
    }
    else {
      Object.assign(notifierOptions, {
        data: this.#compositeRuleAlertData(alert as CompositeRuleAlert),
        template: config.compositeRules!.find((rule) => rule.name === compositeRuleName)!.template
      });
    }
    const notifierLib = notifierConfig.notifier;
    const notifierPackage = Notifier.localPackages.has(notifierLib) ? `@sigyn/${notifierLib}` : notifierLib;

    try {
      const notifier = await import(notifierPackage);
      await notifier.execute(notifierOptions);

      // eslint-disable-next-line no-nested-ternary
      const identifier = rule ? rule.name : compositeRuleName ? compositeRuleName : "SELF-MONITORING";
      this.#logger.info(`[${identifier}](notify: success|notifier: ${alert.notifierConfig.notifier})`);

      if (!rule) {
        this.#queue.done();

        return;
      }

      db.prepare("UPDATE alertNotifs SET status = ? WHERE alertId = ?").run(
        "success", (alert as NotifierAlert).notif.alertId
      );
    }
    catch (error) {
      db.prepare("UPDATE alertNotifs SET status = ? WHERE alertId = ?").run(
        "failed", (alert as NotifierAlert).notif.alertId
      );

      // eslint-disable-next-line no-nested-ternary
      const identifier = rule ? rule.name : compositeRuleName ? compositeRuleName : "SELF-MONITORING";
      this.#logger.error(`[${identifier}](notify: error|notifier: ${alert.notifierConfig.notifier}|message: ${error.message})`);
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
