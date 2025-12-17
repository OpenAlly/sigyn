// Import Node.js Dependencies
import { isDeepStrictEqual } from "node:util";

// Import Internal Dependencies
import { type Logger } from "../index.ts";
import { type DbAgentFailure } from "../database.ts";
import { getAgentFailureRules } from "../utils/selfMonitoring.ts";
import { type Alert, Notifier } from "./notifier.ts";

// CONSTANTS
const kIdentifier = Symbol("agentFailureNotifier");
const kAgentFailureSeverity = "critical";

export interface AgentFailureAlert extends Alert {
  failures: DbAgentFailure[];
}

export class AgentFailureNotifier extends Notifier<AgentFailureAlert> {
  private static shared: AgentFailureNotifier;

  constructor(logger: Logger, identifier: symbol) {
    if (identifier !== kIdentifier) {
      throw new Error("Cannot instanciate AgentFailureNotifier, use AgentFailureNotifier.getSharedInstance instead");
    }

    super(logger, kIdentifier);
  }

  static getSharedInstance(logger: Logger): AgentFailureNotifier {
    this.shared ??= new AgentFailureNotifier(logger, kIdentifier);

    return this.shared;
  }

  override nonUniqueMatcher(notification: AgentFailureAlert, newNotifications: AgentFailureAlert) {
    return isDeepStrictEqual(notification.failures, newNotifications.failures);
  }

  override async sendNotification(alert: AgentFailureAlert) {
    try {
      const { notifierConfig } = alert;
      const notifierOptions = {
        ...notifierConfig,
        data: await this.#agentFailureAlertData(alert),
        template: this.config.selfMonitoring!.template
      };

      await this.execute(notifierOptions);

      this.logger.info(`[SELF-MONITORING](notify: success|notifier: ${notifierConfig.notifier})`);
    }
    catch (error: any) {
      this.logger.error(`[SELF-MONITORING](notify: error|notifier: ${alert.notifierConfig.notifier}|message: ${error.message})`);
      this.logger.debug(error);
    }
  }

  async #agentFailureAlertData(alert: AgentFailureAlert) {
    const { failures } = alert;
    const errors = new Set(failures.map(({ message }) => message));

    return {
      agentFailure: {
        errors: [...errors].join(", "),
        rules: getAgentFailureRules(alert)
      },
      severity: kAgentFailureSeverity
    };
  }
}
