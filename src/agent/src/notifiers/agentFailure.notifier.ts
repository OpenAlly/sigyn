// Import Node.js Dependencies
import { isDeepStrictEqual } from "node:util";

// Import Internal Dependencies
import { Logger } from "..";
import { DbAgentFailure } from "../database";
import { getAgentFailureRules } from "../utils/selfMonitoring";
import { Alert, Notifier } from "./notifier";

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

  nonUniqueMatcher(notification: AgentFailureAlert, newNotifications: AgentFailureAlert) {
    return isDeepStrictEqual(notification.failures, newNotifications.failures);
  }

  async sendNotification(alert: AgentFailureAlert) {
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
    catch (error) {
      this.logger.error(`[SELF-MONITORING](notify: error|notifier: ${alert.notifierConfig.notifier}|message: ${error.message})`);
    }
  }

  async #agentFailureAlertData(alert: AgentFailureAlert) {
    const { failures } = alert;

    return {
      agentFailure: {
        errors: failures.reduce((pre, { message }) => (pre ? `${pre}, ${message}` : message), ""),
        rules: getAgentFailureRules(alert)
      },
      severity: kAgentFailureSeverity
    };
  }
}
