// Import Node.js Dependencies
import assert from "node:assert";
import { after, describe, it } from "node:test";
import fs from "node:fs";

// Import Third-party Dependencies
import SQLite3 from "better-sqlite3";

// Import Internal Dependencies
import { initDB } from "../../src/database";
import * as testHelpers from "./helpers";

// CONSTANTS
const kDummyLogger = { info: () => null } as any;
const kExpectedTablesColumns = {
  rules: [
    { name: "id", dflt_value: null, type: "INTEGER", pk: 1, notnull: 0 },
    { name: "name", dflt_value: null, type: "TEXT", pk: 0, notnull: 1 },
    { name: "counter", dflt_value: "0", type: "INTEGER", pk: 0, notnull: 0 },
    { name: "lastRunAt", dflt_value: null, type: "INTEGER", pk: 0, notnull: 0 },
    { name: "throttleCount", dflt_value: "0", type: "INTEGER", pk: 0, notnull: 0 },
    { name: "lastIntervalReset", dflt_value: null, type: "INTEGER", pk: 0, notnull: 0 },
    { name: "firstReset", dflt_value: "1", type: "INTEGER", pk: 0, notnull: 0 }
  ],
  ruleLogs: [
    { name: "id", dflt_value: null, type: "INTEGER", pk: 1, notnull: 0 },
    { name: "ruleId", dflt_value: null, type: "INTEGER", pk: 0, notnull: 0 },
    { name: "log", dflt_value: null, type: "TEXT", pk: 0, notnull: 0 },
    { name: "timestamp", dflt_value: null, type: "INTEGER", pk: 0, notnull: 0 },
    { name: "processed", dflt_value: "0", type: "INTEGER", pk: 0, notnull: 0 }
  ],
  ruleLabels: [
    { name: "id", dflt_value: null, type: "INTEGER", pk: 1, notnull: 0 },
    { name: "ruleId", dflt_value: null, type: "INTEGER", pk: 0, notnull: 0 },
    { name: "key", dflt_value: null, type: "TEXT", pk: 0, notnull: 0 },
    { name: "value", dflt_value: null, type: "TEXT", pk: 0, notnull: 0 }
  ],
  alerts: [
    { name: "id", dflt_value: null, type: "INTEGER", pk: 1, notnull: 0 },
    { name: "ruleId", dflt_value: null, type: "INTEGER", pk: 0, notnull: 0 },
    { name: "createdAt", dflt_value: null, type: "INTEGER", pk: 0, notnull: 0 }
  ],
  notifiers: [
    { name: "id", dflt_value: null, type: "INTEGER", pk: 1, notnull: 0 },
    { name: "name", dflt_value: null, type: "TEXT", pk: 0, notnull: 1 }
  ],
  alertNotifs: [
    { name: "alertId", dflt_value: null, type: "INTEGER", pk: 0 },
    { name: "notifierId", dflt_value: null, type: "INTEGER", pk: 0 },
    { name: "status", dflt_value: "\"pending\"", type: "TEXT", pk: 0 },
    { name: "retries", dflt_value: 0, type: "INTEGER", pk: 0 }
  ]
};

let db: SQLite3.Database;

function initDb() {
  if (!fs.existsSync("test/.temp")) {
    fs.mkdirSync("test/.temp");
  }

  db = initDB(kDummyLogger, { databaseFilename: "test/.temp/test-db.sqlite3" });
}
// This is a workaround because the test runner does run nested suites BEFORE parent suite's before() hook.
initDb();

describe("Database", () => {
  describe("initDB()", () => {
    after(() => {
      // remove the created db
      testHelpers.deleteDb();
    });

    for (const table of Object.keys(kExpectedTablesColumns)) {
      describe(`should init table '${table}'`, () => {
        const currentTable = kExpectedTablesColumns[table];
        const actualColumns = db.pragma(`table_info(${table})`) as Record<string, string | null>[];

        for (const column of currentTable) {
          const actualColumn = actualColumns.find((col) => col.name === column.name)!;

          describe(`column ${column.name}`, () => {
            it("should exists", () => {
              assert.ok(actualColumn);
            });

            if (column.dflt_value !== undefined) {
              it(`default value should be ${column.dflt_value}`, () => {
                assert.equal(actualColumn.dflt_value, column.dflt_value);
              });
            }

            it(`type should be ${column.type}`, () => {
              assert.equal(actualColumn.type, column.type);
            });

            if (column.pk !== undefined) {
              it(`should${column.pk === 1 ? " " : " NOT"} be a primary key`, () => {
                assert.equal(actualColumn.pk, column.pk);
              });
            }

            if (column.notnull !== undefined) {
              it(`should${column.notnull === 1 ? " " : " NOT"} be non null`, () => {
                assert.equal(actualColumn.notnull, column.notnull);
              });
            }
          });

          it("should not have other column", () => {
            assert.equal(actualColumn.length, currentTable.lengt);
          });
        }
      });
    }
  });
});
