// Import Third-party Dependencies
import { SigynRule } from "@sigyn/config";

// Import Internal Dependencies
import { isCron } from "./cron";

// CONSTANTS
const kOnlyDigitsRegExp = /^\d+$/;
export const OPERATOR_VALUE_REGEXP = /^\s*([<>]=?)\s*(\d+)\s*$/;

export type RuleOperators = ">" | ">=" | "<" | "<=";
export type RuleCounterOperatorValue = [RuleOperators, number];
export type RulePolling = [isCron: boolean, polling: string];

export function countThresholdOperator(
  counter: number | string
): RuleCounterOperatorValue {
  if (typeof counter === "number" || kOnlyDigitsRegExp.test(counter)) {
    return [
      Number(counter) === 0 ? "<=" : ">=",
      Number(counter)
    ];
  }

  const match = counter
    .replace(/\s/g, "")
    .match(OPERATOR_VALUE_REGEXP);
  if (!match || match.length !== 3) {
    throw new Error("Invalid count threshold format.");
  }

  const [, operator, value] = match;

  return [operator as RuleOperators, Number(value)];
}

export function countMatchOperator(
  operator: RuleOperators,
  counter: number,
  count: number
): boolean {
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

export function getPollings(
  polling: SigynRule["polling"]
): RulePolling[] {
  if (typeof polling === "string") {
    return [[isCron(polling), polling]];
  }

  const allPollingsAreCron = polling.every((value) => isCron(value));

  if (!allPollingsAreCron) {
    // multi polling is only supported for cron expressions
    throw new Error("All polling values must be cron expressions");
  }

  return polling.map<RulePolling>((value) => [true, value]);
}
