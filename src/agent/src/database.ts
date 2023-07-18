// Import Node.js Dependencies
import path from "node:path";
import url from "node:url";
import fs from "node:fs";

// Import Third-party Dependencies
import SQLite3 from "better-sqlite3";
import { Logger } from "pino";

// CONSTANTS
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const kDatabaseFilename = process.env.SIGYN_DB ?? "sigyn.sqlite3";
const kDatabaseInitPath = path.join(__dirname, "../data/init-db.sql");

export function initDB(logger: Logger): SQLite3.Database {
  const db = getDB();

  const initRawSQL = fs.readFileSync(kDatabaseInitPath, "utf-8");
  const initSQLQueries = initRawSQL.split(";");

  for (const query of initSQLQueries) {
    db.exec(query);
  }

  logger.info(`[Database] initialized at '${path.join(process.cwd(), kDatabaseFilename)}'`);

  return db;
}

export function getDB(): SQLite3.Database {
  return new SQLite3(kDatabaseFilename);
}
