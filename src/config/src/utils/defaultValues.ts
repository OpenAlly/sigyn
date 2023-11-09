// Import Internal Dependencies
import {
  PartialSigynConfig,
  SigynConfig,
  SigynInitializedConfig,
  SigynInitializedRule,
  SigynInitializedCompositeRule
} from "../types";
import { getSeverity } from "./severity";

// CONSTANTS
const kDefaultMissingLabelStrategy = "ignore";
const kDefaultRulePolling = "1m";
const kDefaultAlertSeverity = "error";
const kDefaultAlertThrottleCount = 0;
const kDefaultRulePollingStrategy = "unbounded";
const kMuteCompositeRulesDefaultDuration = "30m";

export function applyDefaultValues(
  config: PartialSigynConfig | SigynConfig
): SigynInitializedConfig {
  const templates = {};
  for (const [key, template] of Object.entries(config.templates ?? {})) {
    templates[key] = {
      title: template.title ?? "",
      content: template.content ?? []
    };
  }

  return {
    ...config,
    templates,
    missingLabelStrategy: config.missingLabelStrategy ?? kDefaultMissingLabelStrategy,
    defaultSeverity: config.defaultSeverity ?? kDefaultAlertSeverity,
    rules: config.rules.map((rule) => {
      rule.polling ??= kDefaultRulePolling;
      rule.alert.severity = getSeverity(rule.alert.severity ?? config.defaultSeverity ?? kDefaultAlertSeverity);
      rule.alert.template.title ??= "";
      rule.alert.template.content ??= [];
      if (rule.alert.throttle) {
        rule.alert.throttle.count ??= kDefaultAlertThrottleCount;
        rule.alert.throttle.activationThreshold ??= 0;
        rule.alert.throttle.labelScope ??= [];
      }
      rule.disabled ??= false;
      rule.notifiers ??= Object.values(config.notifiers!).map(({ notifier }) => notifier);
      rule.pollingStrategy ??= kDefaultRulePollingStrategy;

      return rule as SigynInitializedRule;
    }),
    selfMonitoring: config.selfMonitoring ? {
      ...config.selfMonitoring,
      template: {
        title: typeof config.selfMonitoring.template === "string" ?
          templates![config.selfMonitoring.template].title ?? "" :
          config.selfMonitoring.template.title ?? "",
        content: typeof config.selfMonitoring.template === "string" ?
          templates![config.selfMonitoring.template].content ?? [] :
          config.selfMonitoring.template.content ?? []
      },
      throttle: config.selfMonitoring.throttle ? {
        ...config.selfMonitoring.throttle,
        activationThreshold: config.selfMonitoring.throttle.activationThreshold ?? 0,
        count: config.selfMonitoring.throttle.count ?? 0
      } : undefined
    } : undefined,
    compositeRules: config.compositeRules ? config.compositeRules.map((rule: SigynInitializedCompositeRule) => {
      // Note: rules are already initialized with `initializeCompositeRules()`.
      rule.notifiers ??= Object.values(config.notifiers!).map(({ notifier }) => notifier);
      rule.template.title ??= "";
      rule.template.content ??= [];
      if (rule.throttle) {
        rule.throttle.count ??= kDefaultAlertThrottleCount;
        rule.throttle.activationThreshold ??= 0;
      }

      rule.muteRules ??= false;
      rule.muteDuration ??= kMuteCompositeRulesDefaultDuration;

      return rule as SigynInitializedCompositeRule;
    }) : undefined
  };
}
