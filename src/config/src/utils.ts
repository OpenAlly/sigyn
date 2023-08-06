// Import Internal Dependencies
import { SigynRule } from "./types";

export function mergeRulesLabelFilters(rules: SigynRule[]) {
  return rules.flatMap((rule) => {
    if (rule.labelFilters) {
      return Object.entries(rule.labelFilters).flatMap(([label, values]) => values.map((value) => {
        const ruleName = `${rule.name} (${label} = ${value})`;
        const logql = fillLogqlLabelFilters(rule.logql, label, value);

        return {
          ...rule,
          name: ruleName,
          logql
        };
      }));
    }

    return rule;
  });
}

export function fillLogqlLabelFilters(logql: string, label: string, value: string) {
  return logql.replace(`{label.${label}}`, `${label}="${value}"`);
}
