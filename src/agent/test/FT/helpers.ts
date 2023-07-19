// Import Node.js Dependencies
import fs from "node:fs";

// Import Internal Dependencies
import { getDB } from "../../src/database";

// CONSTANTS
const kDatabaseFilename = "test/.temp/test-db.sqlite3";

export function deleteDb() {
  if (!fs.existsSync(kDatabaseFilename)) {
    throw new Error(`Cannot delete ${kDatabaseFilename}: file does not exists`);
  }

  getDB().close();

  fs.unlinkSync(kDatabaseFilename);
}
