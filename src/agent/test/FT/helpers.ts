// Import Node.js Dependencies
import fs from "node:fs";
import EventEmitter from "node:events";

// Import Third-party Dependencies
import dayjs from "dayjs";

// Import Internal Dependencies
import { DbAlert, DbAlertNotif, DbNotifier, DbRule, getDB } from "../../src/database";

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
            logs.map((log) => [dayjs().unix(), log])
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

export class MockLogger extends EventEmitter {
  info(message: string) {
    this.emit("info", message);
  }
  error(message: string) {
    this.emit("err", message);
  }
}
