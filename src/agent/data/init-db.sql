PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS rules
  (
    id                INTEGER PRIMARY KEY,
    name              TEXT UNIQUE NOT NULL,
    counter           INTEGER DEFAULT 0,
    threshold         INTEGER DEFAULT 0,
    throttleCount     INTEGER DEFAULT 0,
    lastRunAt         INTEGER,
    lastIntervalReset INTEGER,
    firstReset        INTEGER DEFAULT 1,
    muteUntil         INTEGER DEFAULT 0
  );

CREATE TABLE IF NOT EXISTS ruleLogs
  (
    id        INTEGER PRIMARY KEY,
    log       TEXT,
    ruleId    INTEGER,
    timestamp INTEGER,
    processed INTEGER DEFAULT 0,
    FOREIGN KEY(ruleId)
      REFERENCES rules(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
  );

CREATE TABLE IF NOT EXISTS ruleLabels
  (
    id        INTEGER PRIMARY KEY,
    key       TEXT,
    value     TEXT,
    ruleId    INTEGER,
    timestamp INTEGER,
    FOREIGN KEY(ruleId)
      REFERENCES rules(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
  );

CREATE TABLE IF NOT EXISTS alerts
  (
    id        INTEGER PRIMARY KEY,
    ruleId    INTEGER,
    createdAt INTEGER,
    processed INTEGER DEFAULT 0,
    FOREIGN KEY(ruleId)
      REFERENCES rules(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
  );

CREATE TABLE IF NOT EXISTS alertLabels
  (
    id        INTEGER PRIMARY KEY,
    alertId   INTEGER,
    key       TEXT,
    value     TEXT,
    FOREIGN KEY(alertId)
      REFERENCES alerts(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
  );

CREATE TABLE IF NOT EXISTS notifiers
  (
    id   INTEGER PRIMARY KEY,
    name TEXT NOT NULL
  ); 

CREATE TABLE IF NOT EXISTS alertNotifs
  (
    alertId    INTEGER,
    notifierId INTEGER,
    status     TEXT DEFAULT "pending",
    retries    INTEGER DEFAULT 0,
    FOREIGN KEY(alertId)
      REFERENCES alerts(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    FOREIGN KEY(notifierId)
      REFERENCES notifiers(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
  ); 

CREATE TABLE IF NOT EXISTS agentFailures
  (
    id        INTEGER PRIMARY KEY,
    ruleId    INTEGER,
    message   TEXT,
    timestamp INTEGER,
    count     INTEGER DEFAULT 1,
    FOREIGN KEY(ruleId)
      REFERENCES rules(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
  );

CREATE TABLE IF NOT EXISTS compositeRuleAlerts
  (
    id INTEGER PRIMARY KEY,
    name TEXT,
    createdAt INTEGER
  )
