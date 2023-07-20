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

const kDefaultDatabaseFilename = process.env.SIGYN_DB ?? "sigyn.sqlite3";
const kDatabaseInitPath = path.join(__dirname, "../data/init-db.sql");

let db: SQLite3.Database;

export interface InitDbOptions {
  /**
   * @default process.env.SIGYN_DB.
   *
   * If no SIGYN_DB env found, default to 'sigyn.sqlite3'.
   */
  databaseFilename?: string;
}

export function initDB(logger: Logger, options: InitDbOptions = {}): SQLite3.Database {
  const { databaseFilename = kDefaultDatabaseFilename } = options;
  db = new SQLite3(databaseFilename);

  const initRawSQL = fs.readFileSync(kDatabaseInitPath, "utf-8");
  db.exec(initRawSQL);

  logger.info(`[Database] initialized at '${path.join(process.cwd(), databaseFilename)}'`);

  return db;
}

export function getDB(): SQLite3.Database {
  if (db === undefined) {
    throw new Error("You must init database first");
  }

  return db;
}
