// Import Third-party Dependencies
import dayjs, { type Dayjs } from "dayjs";
import ms from "ms";

// Import Internal Dependencies
import { DbRule, getDB } from "./database";
import { SigynRule } from "./config";

// CONSTANTS
const kOnlyDigitsRegExp = /^\d+$/;
const kOperatorValue = /^\s*([<>]=?)\s*(\d+)\s*$/;

export type RuleCounterOperator = ">" | ">=" | "<" | "<=";
export type RuleCounterOperatorValue = [RuleCounterOperator, number];

export function durationToDate(duration: string, operation: "subtract" | "add"): Dayjs {
  const durationMs = ms(duration);

  return dayjs()[operation](durationMs, "ms");
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

  const match = counter.replace(/\s/g, "").match(kOperatorValue);

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
