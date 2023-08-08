// Import Internal Dependencies
import { SigynConfig, SigynRule } from "./types";

// Import Third-party Dependencies
import { GrafanaLoki } from "@myunisoft/loki";

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

      const ruleName = `${rule.name} (${label} = ${value})`;
      const logql = fillLogqlLabelFilters(rule.logql, label, value);

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

export function fillLogqlLabelFilters(logql: string, label: string, value: string) {
  return logql.replace(`{label.${label}}`, `${label}="${value}"`);
}
