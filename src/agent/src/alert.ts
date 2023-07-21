// Import Internal Dependencies
import { getDB } from "./database";

// Import Third-party Dependencies
import dayjs from "dayjs";

export function createAlert(ruleId: number) {
  return getDB().prepare("INSERT INTO alerts (ruleId, createdAt) VALUES (?, ?)").run(
    ruleId,
    dayjs().unix()
  );
}
