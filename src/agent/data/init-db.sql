PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS rules
  (
     name      TEXT UNIQUE,
     counter   INTEGER DEFAULT 0,
     lastRunAt INTEGER
  );

CREATE TABLE IF NOT EXISTS counters
  (
     name      TEXT,
     counter   INTEGER,
     timestamp INTEGER
  ); 