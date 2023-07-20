// Import Internal Dependencies
import { getConfig } from "./config";
import { getDB } from "./database";
import { DbNotifier, DbRule, SigynNotifiers, SigynRule } from "./types";

// Import Third-party Dependencies
import { Logger } from "pino";
import dayjs from "dayjs";

// CONSTANTS
const kWebhookUsername = "Sigyn Agent";

// TODO: discord package & httpie
const discord = {
  executeWebhook: async function execute(options, webhookStructure) {
    await fetch(options.webhookUrl, {
      method: "POST",
      body: JSON.stringify(webhookStructure),
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
};

export interface AlertOptions {
  logger: Logger;
}

type GetProperty<T extends SigynNotifiers, K extends keyof SigynNotifiers> = K extends "discord"
  ? T["discord"]
  : never;

export class Alert {
  #notifiers: SigynNotifiers;
  #rule: DbRule;
  #ruleConfig: SigynRule;
  #logger: Logger;

  constructor(ruleName: string, options: AlertOptions) {
    const { logger } = options;
    const config = getConfig();
    const db = getDB();

    const rule = db.prepare("SELECT * FROM rules WHERE name = ?").get(ruleName) as DbRule;

    this.#rule = rule;
    this.#ruleConfig = config.rules.find(({ name }) => name === rule.name)!;
    this.#notifiers = config.notifiers;
    this.#logger = logger;
  }

  async send() {
    const db = getDB();
    const insertedAlert = db.prepare("INSERT INTO alerts (ruleId, createdAt) VALUES (?, ?)").run(
      this.#rule.id,
      dayjs().unix()
    );

    for (const [notifier, options] of this.#getNotifiers()) {
      if (options.template) {
        throw new Error("template is not supported yet");
      }

      let notifFailed = false;

      try {
        await this.#notify(notifier, options);
      }
      catch (error) {
        notifFailed = true;

        this.#logger.error(`[${this.#rule.name}](state: notify|error: ${error.message})`);

        throw error;
      }
      finally {
        db.prepare("INSERT INTO alertNotifs (alertId, notifierId, status) VALUES (?, ?, ?)").run(
          insertedAlert.lastInsertRowid,
          this.#databaseNotifierId(notifier),
          notifFailed ? "error" : "success"
        );
      }
    }
  }

  * #getNotifiers(): Generator<any, void> {
    const ruleConfigNotifiers = this.#ruleConfig.notifiers ?? [];
    const notifiers: string[] = ruleConfigNotifiers.length > 0 ? ruleConfigNotifiers : Object.keys(this.#notifiers);

    for (const notifier of notifiers) {
      yield [notifier, this.#notifiers[notifier]];
    }
  }

  #databaseNotifierId(notifierName: string) {
    const db = getDB();
    const dbNotifier = db.prepare("SELECT id FROM notifiers WHERE name = ?").get(notifierName) as Pick<DbNotifier, "id">;

    if (dbNotifier) {
      return dbNotifier.id;
    }

    const { lastInsertRowid } = db.prepare("INSERT INTO notifiers (name) VALUES (?)").run(notifierName);

    return lastInsertRowid;
  }

  async #notify<K extends keyof SigynNotifiers>(notifier: K, options: GetProperty<SigynNotifiers, K>) {
    switch (notifier) {
      case "discord":
        await discord.executeWebhook(options, this.#webhookStructure());
        break;

      default:
        throw new Error(`Unknown notifier: ${notifier}`);
    }
  }

  #webhookStructure() {
    const { count, interval } = this.#ruleConfig.alert.on;
    const ruleName = this.#ruleConfig.name;

    const content = [
      `### 🚨 ${ruleName} - Triggered ${this.#rule.counter} times!`,
      `- LogQL: \`${this.#ruleConfig.logql.replaceAll("`", "'")}\``,
      `- Threshold: **${count}**`,
      `- Interval: **${interval}**`,
      `- Polling: **${this.#ruleConfig.polling}**`,
      "[See logs on Loki](https://todo.com)"
    ].join("\n");

    return {
      content,
      username: kWebhookUsername
    };
  }
}
