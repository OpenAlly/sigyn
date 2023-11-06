// Import Third-party Dependencies
import { GrafanaLoki } from "@myunisoft/loki";
import { minimatch } from "minimatch";

// Import Internal Dependencies
import {
  AlertSeverity,
  PartialSigynConfig,
  SigynAlertTemplate,
  SigynConfig,
  SigynInitializedTemplate,
  SigynInitializedConfig,
  SigynInitializedRule,
  SigynRule,
  SigynInitializedCompositeRule,
  SigynCompositeRule
} from "./types";
import { isDeepStrictEqual } from "util";

// CONSTANTS
const kDefaultMissingLabelStrategy = "ignore";
const kDefaultRulePolling = "1m";
const kDefaultAlertSeverity = "error";
const kDefaultAlertThrottleCount = 0;
const kDefaultRulePollingStrategy = "unbounded";
const kDefaultCompositeRuleInterval = "1d";
const kMuteCompositeRulesDefaultDuration = "30m";

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

export function initializeCompositeRules(config: SigynConfig): SigynInitializedCompositeRule[] {
  if (!config.compositeRules) {
    return [];
  }

  const ruleNames = config.rules.map((rule) => rule.name);
  const compositeRules: SigynInitializedCompositeRule[] = [];

  for (const compositeRule of config.compositeRules) {
    const excludeRules = (compositeRule.exclude ?? []).flatMap(
      (ruleToExclude) => ruleNames.filter((ruleName) => minimatch(ruleName, ruleToExclude))
    );
    const includeRules = compositeRule.include?.flatMap(
      (ruleToInclude) => ruleNames.filter((ruleName) => minimatch(ruleName, ruleToInclude))
    ) ?? ruleNames;
    const rules = ruleNames.filter((rule) => includeRules.includes(rule) && !excludeRules.includes(rule));

    compositeRules.push({
      ...compositeRule,
      rules,
      interval: compositeRule.interval ?? kDefaultCompositeRuleInterval
    } as SigynInitializedCompositeRule);

    {
      const compositeRule = compositeRules.at(-1)!;
      if (compositeRule.rules.length <= 1) {
        throw new Error(`Composite rule ${compositeRule.name} require at least 2 matching rules`);
      }

      if (compositeRules.filter((rule) => isDeepStrictEqual(rule.rules, compositeRule.rules)).length > 1) {
        throw new Error("Found multiple composite rules wich scope the same rules");
      }

      const ruleCount = compositeRule.rules.length;
      const ruleCountThreshold = compositeRule.ruleCountThreshold ?? 0;
      if (ruleCountThreshold > ruleCount) {
        throw new Error(`ruleCountThreshold (${ruleCountThreshold}) cannot be higher than total rule (${ruleCount})`);
      }
    }
  }

  return compositeRules;
}

export function handleCompositeRulesTemplates(
  config: SigynConfig,
  compositeRules: SigynCompositeRule[]
): SigynCompositeRule[] {
  if (compositeRules.length === 0) {
    return [];
  }

  const clonedRules = structuredClone(compositeRules);

  for (const rule of clonedRules) {
    if (typeof rule.template === "object" && rule.template.extends) {
      rule.template = extendsTemplates(rule.template, config);
    }
    else if (typeof rule.template === "string") {
      rule.template = config.templates![rule.template];
    }
  }

  return clonedRules;
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
      rule.notifiers ??= Object.keys(config.notifiers!);
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
    compositeRules: config.compositeRules ? config.compositeRules.map((rule) => {
      // Note: rules are already initialized with `initializeCompositeRules()`.
      rule.notifiers ??= Object.keys(config.notifiers!);
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
    if (template.content?.at) {
      for (const { index, value } of Object.values(template.content.at)) {
        templateContent.splice(Number(index), 0, value);
      }
    }
  }

  return {
    title: template.title ?? baseTemplate?.title,
    content: templateContent
  };
}
