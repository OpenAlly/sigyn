// Import Third-party Dependencies
import dayjs, { type Dayjs } from "dayjs";
import ms from "ms";
import cronParser from "cron-parser";

// Import Internal Dependencies
import { DbRule, getDB } from "./database";
import { SigynRule } from "./config";

// CONSTANTS
const kOnlyDigitsRegExp = /^\d+$/;
const kSigynNotifiers = new Set([
  "discord",
  "slack",
  "teams"
]);
const kOperatorValueRegExp = /^\s*([<>]=?)\s*(\d+)\s*$/;
const kCronExpressionRegExp = /(((\d+,)+\d+|(\d+(\/|-)\d+)|\d+|\*) ?){5,6}/;

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
    return [">=", Number(counter)];
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

export function getRulePollings(polling: string | string[]): RulePolling[] {
  if (polling.length === 0) {
    throw new Error("Missing polling value");
  }

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
