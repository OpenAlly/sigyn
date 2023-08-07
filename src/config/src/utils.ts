// Import Internal Dependencies
import { SigynConfig, SigynRule } from "./types";

// Import Third-party Dependencies
import { GrafanaLoki } from "@myunisoft/loki";

export async function mergeRulesLabelFilters(config: SigynConfig): Promise<SigynRule[]> {
  const labels = await fetchRulesLabels(config);

  return config.rules.map((rule) => {
    if (rule.labelFilters) {
      return Object.entries(rule.labelFilters).flatMap(([label, values]) => {
        if (!labels.has(label)) {
          throw new Error(`Label '${label}' not found`);
        }

        return values.map((value) => {
          if (!labels.get(label)?.includes(value)) {
            if (rule.missingLabelStrategy === "error") {
              throw new Error(`Label '${label}' with value '${value}' not found`);
            }

            // skip rule if label value not found
            return [];
          }

          const ruleName = `${rule.name} (${label} = ${value})`;
          const logql = fillLogqlLabelFilters(rule.logql, label, value);

          return {
            ...rule,
            name: ruleName,
            logql
          };
        });
      });
    }

    return rule;
  }).flat(2);
}

export async function fetchRulesLabels(config: Pick<SigynConfig, "loki" | "rules">) {
  const lokiApi = new GrafanaLoki({
    remoteApiURL: config.loki.apiUrl
  });

  const labels = new Map<string, string[]>();

  for (const rule of config.rules) {
    if (rule.labelFilters) {
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
  }

  return labels;
}

export function fillLogqlLabelFilters(logql: string, label: string, value: string) {
  return logql.replace(`{label.${label}}`, `${label}="${value}"`);
}
