// Import Third-party Dependencies
import { SigynRule, AlertSeverity, getConfig } from "@sigyn/config";
import dayjs, { type Dayjs } from "dayjs";
import ms from "ms";
import cronParser from "cron-parser";

// Import Internal Dependencies
import { DbRule, getDB } from "./database";
import { DEFAULT_POLLING } from "./rules";

// CONSTANTS
const kOnlyDigitsRegExp = /^\d+$/;
const kSigynNotifiers = new Set([
  "discord",
  "slack",
  "teams"
]);
const kOperatorValueRegExp = /^\s*([<>]=?)\s*(\d+)\s*$/;
const kCronExpressionRegExp = /(((\d+,)+\d+|(\d+(\/|-)\d+)|\d+|\*) ?){5,6}/;
const kDefaultSeverity = 2;

export type RuleCounterOperator = ">" | ">=" | "<" | "<=";
export type RuleCounterOperatorValue = [RuleCounterOperator, number];
export type RulePolling = [isCron: boolean, polling: string];

export function durationOrCronToDate(durationOrCron: string, operation: "subtract" | "add"): Dayjs {
  if (kCronExpressionRegExp.test(durationOrCron)) {
    const cron = cronParser.parseExpression(durationOrCron).next();

    return dayjs(cron[operation === "subtract" ? "prev" : "next"]().toString());
  }

  return dayjs()[operation](ms(durationOrCron), "ms");
}

export function cleanRulesInDb(configRules: SigynRule[]) {
  const db = getDB();

  const dbRules = db.prepare("SELECT * FROM rules").all() as DbRule[];

  for (const dbRule of dbRules) {
    const dbRuleConfig = configRules.find((rule) => rule.name === dbRule.name);

    if (dbRuleConfig === undefined) {
      db.prepare("DELETE FROM rules WHERE name = ?").run(dbRule.name);
    }
  }
}

export function ruleCountThresholdOperator(counter: number | string): RuleCounterOperatorValue {
  if (typeof counter === "number" || kOnlyDigitsRegExp.test(counter)) {
    return [Number(counter) === 0 ? "<=" : ">=", Number(counter)];
  }

  const match = counter.replace(/\s/g, "").match(kOperatorValueRegExp);

  if (!match || match.length !== 3) {
    throw new Error("Invalid count threshold format.");
  }

  const [, operator, value] = match;

  return [operator as RuleCounterOperator, Number(value)];
}

export function ruleCountMatchOperator(operator: RuleCounterOperator, counter: number, count: number): boolean {
  switch (operator) {
    case ">":
      return counter > count;
    case ">=":
      return counter >= count;
    case "<":
      return counter < count;
    case "<=":
      return counter <= count;
    default:
      throw new Error(`Invalid operator: ${operator}`);
  }
}

export function getNotifierPackage(notifier: string) {
  return kSigynNotifiers.has(notifier) ? `@sigyn/${notifier}` : notifier;
}

export function getRulePollings(polling: SigynRule["polling"] = DEFAULT_POLLING): RulePolling[] {
  if (typeof polling === "string") {
    return [[kCronExpressionRegExp.test(polling), polling]];
  }

  const allPollingsAreCron = polling.every((value) => kCronExpressionRegExp.test(value));

  if (!allPollingsAreCron) {
    // multi polling is only supported for cron expressions
    throw new Error("All polling values must be cron expressions");
  }

  return polling.map<RulePolling>((value) => [true, value]);
}

/**
 * Parse a LogQL string to extract labels.
 *
 * @example
 * ```ts
 * const logql = "{app=\"foo\", env=\"preprod\"} |= `my super logql`"
 * const labels = parseLogQLLabels(logql);
 * assert.deepStrictEqual(labels, { app: "foo", env: "preprod" });
 * ```
 */
export function parseLogQLLabels(logql: string): Record<string, string> {
  const labels: Record<string, string> = {};

  const match = logql.match(/{(.*)}/);
  if (!match || match.length !== 2) {
    return labels;
  }

  const [, labelsStr] = match;
  const labelsArr = labelsStr.split(",");

  for (const label of labelsArr) {
    const [key, value] = label.split("=").map((str) => str.trim().replaceAll(/"/g, ""));

    if (key && value) {
      labels[key] = value;
    }
  }

  return labels;
}

export function getSeverity(sev: undefined | AlertSeverity): Extract<AlertSeverity, 1 | 2 | 3 | 4> {
  const { defaultSeverity = kDefaultSeverity } = getConfig();

  switch (sev) {
    case 1:
    case "1":
    case "critical":
      return 1;
    case 2:
    case "2":
    case "error":
    case "major":
      return 2;
    case 3:
    case "3":
    case "warning":
    case "minor":
      return 3;
    case 4:
    case "4":
    case "information":
    case "info":
    case "low":
      return 4;
    default:
      return getSeverity(defaultSeverity);
  }
}
