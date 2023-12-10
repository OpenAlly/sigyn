// Import Third-party Dependencies
import { GrafanaApi } from "@myunisoft/loki";

// Import Internal Dependencies
import { SigynConfig, SigynInitializedRule, SigynRule } from "../types";
import { extendsTemplates } from "./templates";

export async function initialize(config: SigynConfig): Promise<SigynRule[]> {
  const labels = await fetchLabels(config);

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

    for (const { label, value } of getLabelFilters(rule)) {
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

function* getLabelFilters(rule: SigynRule) {
  if (!rule.labelFilters) {
    return;
  }

  for (const [label, values] of Object.entries(rule.labelFilters)) {
    for (const value of values) {
      yield { label, value };
    }
  }
}

export async function fetchLabels(config: Pick<SigynConfig, "loki" | "rules">) {
  const lokiApi = new GrafanaApi({
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
        const labelValues = await lokiApi.Loki.labelValues(label);

        labels.set(label, labelValues);
      }
      catch {
        labels.set(label, []);
      }
    }
  }

  return labels;
}

export function applyLogQLVariables(config: SigynConfig) {
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
