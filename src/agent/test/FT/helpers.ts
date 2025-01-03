// Import Node.js Dependencies
import fs from "node:fs";

// Import Third-party Dependencies
import dayjs from "dayjs";

// Import Internal Dependencies
import { DbAlert, DbAlertNotif, DbNotifier, DbRule, getDB } from "../../src/database.js";
import { Rule } from "../../src/rules.js";

// CONSTANTS
const kDatabaseFilename = "test/.temp/test-db.sqlite3";

export function deleteDb() {
  if (!fs.existsSync(kDatabaseFilename)) {
    throw new Error(`Cannot delete ${kDatabaseFilename}: file does not exists`);
  }

  getDB().close();

  fs.unlinkSync(kDatabaseFilename);
}

export function mockGrafanaApiResponse(logs: string[]) {
  return {
    status: "success",
    data: {
      result: [
        {
          values: [
            logs.map((log) => [dayjs().valueOf(), log])
          ]
        }
      ]
    }
  };
}

export function getRuleAlertNotifs(ruleName: string) {
  const { id } = getDB().prepare("SELECT id FROM rules WHERE name = ?").get(ruleName) as DbRule;

  const { id: alertId } = getDB().prepare("SELECT id FROM alerts WHERE ruleId = ?").get(id) as DbAlert;

  const notifiers = getDB().prepare("SELECT * FROM notifiers").all() as DbNotifier[];
  const alertNotifs = getDB().prepare("SELECT * FROM alertNotifs WHERE alertId = ?").all(alertId) as DbAlertNotif[];

  return alertNotifs.map((alertNotif) => {
    return {
      ...alertNotif,
      notifier: notifiers.find((notifier) => notifier.id === alertNotif.notifierId)!.name
    };
  });
}

export class MockLogger {
  info(message: string) {
    console.log("📢", message);
  }
  error(message: string) {
    console.log("❗", message);
  }
  debug() {
    return void 0;
  }
}

export function resetAgentFailures() {
  getDB().prepare("DELETE FROM agentFailures").run();
}

export function createRuleAlert(rule: Rule, times: number) {
  let i = 0;
  while (i++ < times) {
    getDB()
      .prepare("INSERT INTO alerts (ruleId, createdAt) VALUES (?, ?)")
      .run(rule.getRuleFromDatabase().id, Date.now());
  }
}

export function ruleMuteUntilTimestamp(rule: Rule): number {
  const { muteUntil } = getDB()
    .prepare("SELECT muteUntil FROM rules WHERE name = ?")
    .get(rule.config.name) as { muteUntil: number; };

  return muteUntil;
}

export function resetRuteMuteUntil(rule: Rule): void {
  getDB()
    .prepare("UPDATE rules SET muteUntil = ? WHERE name = ?")
    .run(0, rule.config.name);
}
