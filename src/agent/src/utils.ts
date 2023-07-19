// Import Third-party Dependencies
import dayjs, { type Dayjs } from "dayjs";
import ms from "ms";

// Import Internal Dependencies
import { getDB } from "./database";
import { DbRule, SigynRule } from "./types";

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
