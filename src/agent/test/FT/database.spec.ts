// Import Node.js Dependencies
import assert from "node:assert";
import { after, before, describe, it } from "node:test";
import fs from "node:fs";

// Import Third-party Dependencies
import SQLite3 from "better-sqlite3";

// Import Internal Dependencies
import { initDB } from "../../src/database";
import * as testHelpers from "./helpers";

// CONSTANTS
const kDummyLogger = { info: () => null } as any;

describe("Database", () => {
  describe("initDB()", () => {
    let db: SQLite3.Database;

    before(() => {
      if (!fs.existsSync("test/.temp")) {
        fs.mkdirSync("test/.temp");
      }

      db = initDB(kDummyLogger, { databaseFilename: "test/.temp/test-db.sqlite3" });
    });


    after(() => {
      // remove the created db
      testHelpers.deleteDb();
    });

    it("should init table 'rules'", () => {
      const actualColumns = db.pragma("table_info(rules)") as Record<string, string | null>[];
      const expectedColumns = [
        { dflt_value: null, name: "name", type: "TEXT" },
        { dflt_value: "0", name: "counter", type: "INTEGER" },
        { dflt_value: null, name: "lastRunAt", type: "INTEGER" }
      ];

      assert.equal(actualColumns.length, expectedColumns.length);

      for (const column of actualColumns) {
        const { dflt_value, name, type } = column;
        assert.deepEqual({ dflt_value, name, type }, expectedColumns.shift());
      }
    });

    it("should init table 'counters'", () => {
      const actualColumns = db.pragma("table_info(counters)") as Record<string, string | null>[];
      const expectedColumns = [
        { dflt_value: null, name: "name", type: "TEXT" },
        { dflt_value: null, name: "counter", type: "INTEGER" },
        { dflt_value: null, name: "timestamp", type: "INTEGER" }
      ];

      assert.equal(actualColumns.length, expectedColumns.length);

      for (const column of actualColumns) {
        const { dflt_value, name, type } = column;
        assert.deepEqual({ dflt_value, name, type }, expectedColumns.shift());
      }
    });
  });
});
