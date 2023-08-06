// Import Internal Dependencies
import { SigynRule } from "./types";

// CONSTANTS
const kLineContainsOperator = "|=";

export function mergeRulesLabelFilters(rules: SigynRule[]) {
  return rules.flatMap((rule) => {
    if (rule.labelFilters) {
      return Object.entries(rule.labelFilters).flatMap(([label, values]) => values.map((value) => {
        const ruleName = `${rule.name} (${label} = ${value})`;
        const logql = updateLogqlWithLabelFilters(rule.logql, label, value);

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

export function updateLogqlWithLabelFilters(logql: string, label: string, value: string) {
  const labelFilter = `${label}="${value}"`;
  const regex = new RegExp("{(.*)}(.*)", "g");
  const match = regex.exec(logql);

  if (match === null) {
    return `{${label}="${value}"} ${kLineContainsOperator} \`${logql}\``;
  }

  const [, labels, query] = match;
  const newLabels = labels.length === 0 ? labelFilter : `${labels}, ${labelFilter}`;

  return `{${newLabels}}${query}`;
}
