// Import Internal Dependencies
import { Logger } from "..";
import { Rule } from "../rules";
import { Alert, Notifier } from "./notifier";

// CONSTANTS
const kIdentifier = Symbol("compositeRuleNotifier");
const kCompositeRuleSeverity = "critical";

export interface CompositeRuleAlert extends Alert {
  compositeRuleName: string;
}

export class CompositeRuleNotifier extends Notifier<CompositeRuleAlert> {
  private static shared: CompositeRuleNotifier;

  constructor(logger: Logger, identifier: symbol) {
    if (identifier !== kIdentifier) {
      throw new Error("Cannot instanciate CompositeRuleNotifier, use CompositeRuleNotifier.getSharedInstance instead");
    }

    super(logger, kIdentifier);
  }

  static getSharedInstance(logger: Logger): CompositeRuleNotifier {
    this.shared ??= new CompositeRuleNotifier(logger, kIdentifier);

    return this.shared;
  }

  nonUniqueMatcher(notification: CompositeRuleAlert, newNotifications: CompositeRuleAlert) {
    return notification.compositeRuleName === newNotifications.compositeRuleName;
  }

  async sendNotification(alert: CompositeRuleAlert) {
    const { notifierConfig, compositeRuleName } = alert;
    const notifierOptions = {
      ...notifierConfig,
      data: this.#compositeRuleAlertData(alert),
      template: this.config.compositeRules!.find((rule) => rule.name === compositeRuleName)!.template
    };

    try {
      await this.execute(notifierOptions);

      this.logger.info(`[${compositeRuleName}](notify: success|notifier: ${notifierConfig.notifier})`);
    }
    catch (error) {
      this.logger.error(`[${compositeRuleName}](notify: error|notifier: ${notifierConfig.notifier}|message: ${error.message})`);
      this.logger.debug(error);
    }
  }

  #compositeRuleAlertData(alert: CompositeRuleAlert) {
    const { compositeRuleName } = alert;

    const compositeRule = this.config.compositeRules!.find((compositeRule) => compositeRule.name === compositeRuleName)!;
    const rulesLabels = Object.create(null);

    this.config.rules.forEach((ruleConfig) => {
      if (compositeRule.rules.includes(ruleConfig.name) === false) {
        return;
      }

      const rule = new Rule(ruleConfig, { logger: this.logger });
      rule.init();
      const { labels } = rule.getAlertFormattedRule();
      Object.assign(rulesLabels, labels);
    });

    return {
      // TODO: make it configurable
      severity: kCompositeRuleSeverity,
      compositeRuleName,
      label: rulesLabels,
      rules: compositeRule.rules.join(", ")
    };
  }
}
