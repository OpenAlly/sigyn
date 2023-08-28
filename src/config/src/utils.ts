// Import Internal Dependencies
import { AlertSeverity, PartialSigynConfig, SigynConfig, SigynRule } from "./types";

// Import Third-party Dependencies
import { GrafanaLoki } from "@myunisoft/loki";

// CONSTANTS
const kDefaultMissingLabelStrategy = "ignore";
const kDefaultRulePolling = "1m";
const kDefaultAlertSeverity = "error";
const kDefaultAlertThrottleCount = 0;
const kDefaultRulePollingStrategy = "unbounded";

export async function mergeRulesLabelFilters(config: SigynConfig): Promise<SigynRule[]> {
  const labels = await fetchRulesLabels(config);

  const mergedRules: SigynRule[] = [];

  for (const rule of config.rules) {
    if (!rule.labelFilters) {
      mergedRules.push(rule);

      continue;
    }

    for (const { label, value } of getRuleLabelFilters(rule)) {
      if (!labels.get(label)?.includes(value)) {
        if (config.missingLabelStrategy === "error") {
          throw new Error(`Label '${label}' with value '${value}' not found`);
        }

        // skip rule if label value not found
        continue;
      }

      const ruleName = rule.name.includes(`{label.${label}}`) ?
        rule.name.replace(`{label.${label}}`, `${value}`) :
        `${rule.name} (${label} = ${value})`;

      const logql = rule.logql.replace(`{label.${label}}`, `"${value}"`);

      mergedRules.push({
        ...rule,
        name: ruleName,
        logql
      });
    }
  }


  return mergedRules;
}

function* getRuleLabelFilters(rule: SigynRule) {
  if (!rule.labelFilters) {
    return;
  }

  for (const [label, values] of Object.entries(rule.labelFilters)) {
    for (const value of values) {
      yield { label, value };
    }
  }
}

export async function fetchRulesLabels(config: Pick<SigynConfig, "loki" | "rules">) {
  const lokiApi = new GrafanaLoki({
    remoteApiURL: config.loki.apiUrl
  });

  const labels = new Map<string, string[]>();

  for (const rule of config.rules) {
    if (!rule.labelFilters) {
      continue;
    }

    for (const label of Object.keys(rule.labelFilters)) {
      if (labels.has(label)) {
        continue;
      }

      try {
        const labelValues = await lokiApi.labelValues(label);

        labels.set(label, labelValues);
      }
      catch {
        labels.set(label, []);
      }
    }
  }

  return labels;
}

export function applyDefaultValues(
  config: PartialSigynConfig | SigynConfig
): SigynConfig {
  return {
    ...config,
    missingLabelStrategy: config.missingLabelStrategy ?? kDefaultMissingLabelStrategy,
    defaultSeverity: config.defaultSeverity ?? kDefaultAlertSeverity,
    rules: config.rules.map((rule) => {
      rule.polling ??= kDefaultRulePolling;
      rule.alert.severity = getSeverity(rule.alert.severity ?? config.defaultSeverity ?? kDefaultAlertSeverity);
      if (rule.alert.throttle) {
        rule.alert.throttle.count ??= kDefaultAlertThrottleCount;
      }
      rule.disabled ??= false;
      rule.notifiers ??= Object.keys(config.notifiers!);
      rule.pollingStrategy ??= kDefaultRulePollingStrategy;

      return rule as SigynRule;
    })
  };
}

export function getSeverity(sev: AlertSeverity): "critical" | "error" | "warning" | "info" {
  switch (sev) {
    case "critical":
      return sev;
    case "error":
    case "major":
      return "error";
    case "warning":
    case "minor":
      return "warning";
    case "information":
    case "info":
    case "low":
      return "info";
    default:
      throw new Error(`Invalid severity: ${sev}`);
  }
}
