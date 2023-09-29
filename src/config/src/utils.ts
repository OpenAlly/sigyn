// Import Internal Dependencies
import {
  AlertSeverity,
  PartialSigynConfig,
  SigynAlertTemplate,
  SigynConfig,
  SigynInitializedTemplate,
  SigynInitializedConfig,
  SigynInitializedRule,
  SigynRule
} from "./types";

// Import Third-party Dependencies
import { GrafanaLoki } from "@myunisoft/loki";

// CONSTANTS
const kDefaultMissingLabelStrategy = "ignore";
const kDefaultRulePolling = "1m";
const kDefaultAlertSeverity = "error";
const kDefaultAlertThrottleCount = 0;
const kDefaultRulePollingStrategy = "unbounded";

export async function initializeRules(config: SigynConfig): Promise<SigynRule[]> {
  const labels = await fetchRulesLabels(config);

  const mergedRules: SigynRule[] = [];

  for (const rule of config.rules) {
    if (typeof rule.alert.template === "object" && rule.alert.template.extends) {
      rule.alert.template = extendsTemplates(rule.alert.template, config);
    }
    else if (typeof rule.alert.template === "string") {
      rule.alert.template = config.templates![rule.alert.template];
    }

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

      const logql = typeof rule.logql === "string" ?
        rule.logql.replace(`{label.${label}}`, `"${value}"`) :
        {
          ...rule.logql,
          query: rule.logql.query.replace(`{label.${label}}`, `"${value}"`)
        };

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
): SigynInitializedConfig {
  return {
    ...config,
    templates: config.templates as Record<string, SigynInitializedTemplate>,
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

      return rule as SigynInitializedRule;
    }),
    selfMonitoring: config.selfMonitoring ? {
      ...config.selfMonitoring,
      template: typeof config.selfMonitoring.template === "string" ?
        config.templates![config.selfMonitoring.template] as SigynInitializedTemplate :
        config.selfMonitoring.template
    } : undefined
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

export function applyRulesLogQLVariables(config: SigynConfig) {
  const rules: SigynInitializedRule[] = [];

  for (const rule of config.rules) {
    if (typeof rule.logql === "string" || Object.keys(rule.logql.vars ?? {}).length === 0) {
      rules.push({
        ...rule,
        logql: typeof rule.logql === "string" ? rule.logql : rule.logql.query
      } as SigynInitializedRule);
      continue;
    }

    const formattedRule = { ...rule, logql: rule.logql.query };

    for (const [key, value] of Object.entries(rule.logql.vars!)) {
      const replaceWith = typeof value === "string" ? value : value.join("|");
      formattedRule.logql = formattedRule.logql.replace(`{vars.${key}}`, replaceWith);
    }

    rules.push(formattedRule as SigynInitializedRule);
  }

  return rules;
}

export function extendsTemplates(template: SigynAlertTemplate, config: SigynConfig): SigynInitializedTemplate {
  const configTemplates = config.templates!;

  function getBaseTemplate(key: string): SigynInitializedTemplate {
    const baseTemplate = configTemplates[key];

    if (baseTemplate.extends) {
      return extendsTemplates(baseTemplate, config);
    }

    return baseTemplate as SigynInitializedTemplate;
  }

  if (template.extends === undefined) {
    return template as SigynInitializedTemplate;
  }

  const baseTemplate = getBaseTemplate(template.extends);
  const templateContent = baseTemplate.content ? [...baseTemplate.content] : [];

  if (Array.isArray(template.content)) {
    templateContent.push(...template.content);
  }
  else {
    if (template.content?.after) {
      templateContent.push(...template.content.after);
    }
    if (template.content?.before) {
      templateContent.unshift(...template.content.before);
    }
  }

  return {
    title: template.title ?? baseTemplate?.title,
    content: templateContent
  };
}
