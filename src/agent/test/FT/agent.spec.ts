/* eslint-disable max-len */
// Import Node.js Dependencies
import assert from "node:assert";
import { after, before, describe, it } from "node:test";
import path from "node:path";
import fs from "node:fs";
import { once } from "node:events";

// Import Third-party Dependencies
import { MockAgent, MockPool, getGlobalDispatcher, setGlobalDispatcher } from "@myunisoft/httpie";

// Import Internal Dependencies
import { start } from "../../src";
import { DbRule, getDB, initDB } from "../../src/database";
import { MockLogger, getRuleAlertNotifs, mockGrafanaApiResponse } from "./helpers";

// CONSTANTS
const kMockAgent = new MockAgent();
const kDispatcher = getGlobalDispatcher();
const kNoRulesConfigLocation = path.join(__dirname, "/fixtures/no-rules");
const kConfigLocation = path.join(__dirname, "/fixtures");
const kMultiPollingConfigLocation = path.join(__dirname, "/fixtures/multi-polling");

const logger: any = new MockLogger();

describe("Sigyn Agent", () => {
  let slackPool: MockPool;
  let discordPool: MockPool;

  before(() => {
    // we create a temp folder to store the test database
    if (fs.existsSync(".temp")) {
      fs.rmSync(".temp", { recursive: true });
      fs.mkdirSync(".temp");
    }
    else {
      fs.mkdirSync(".temp");
    }

    initDB(logger, { databaseFilename: ".temp/test-agent.sqlite3" });

    setGlobalDispatcher(kMockAgent);

    const grafanaPool = kMockAgent.get("http://localhost:3100");
    const grafanaResponseOptions = { headers: { "Content-Type": "application/json" } };
    grafanaPool.intercept({
      path: () => true
    }).reply(200, mockGrafanaApiResponse(["my super logql"]), grafanaResponseOptions).persist();

    slackPool = kMockAgent.get("https://hooks.slack.com");
    discordPool = kMockAgent.get("https://discord.com");

    kMockAgent.disableNetConnect();
  });

  after(() => {
    kMockAgent.enableNetConnect();
    setGlobalDispatcher(kDispatcher);
  });

  it("should remove rules from database if they are not in the config file", async() => {
    function getUnknownRule() {
      return getDB().prepare("SELECT * FROM rules WHERE name = ?").get("unknown-rule") as DbRule;
    }

    getDB().prepare("INSERT INTO rules (name) VALUES (?)").run("unknown-rule");

    assert.equal(getUnknownRule().name, "unknown-rule");

    const sheduler = await start(kNoRulesConfigLocation);

    assert.equal(getUnknownRule(), undefined);

    sheduler.stop();
  });

  it("should add rules from config file to database", async() => {
    const sheduler = await start(kConfigLocation);

    const rule = getDB().prepare("SELECT * FROM rules WHERE name = ?").get("test1") as DbRule;

    assert.equal(rule.name, "test1");

    sheduler.stop();
  });

  it("should fetch logs 4 times then send alert", async() => {
    getDB().prepare("DELETE FROM counters WHERE ruleId = ?").run(1);
    discordPool.intercept({
      method: "POST",
      path: () => true
    }).reply(200);
    slackPool.intercept({
      method: "POST",
      path: () => true
    }).reply(200);

    const sheduler = await start(kMultiPollingConfigLocation, logger);

    const [handleLogsLog] = await once(logger, "info");
    assert.equal(handleLogsLog, "[test1](state: handle|previous: 0|new: 1|next: 1|threshold: 4)");

    const [pollingLog] = await once(logger, "info");
    assert.equal(pollingLog, "[test1](state: polling start|polling: 1s|query: {app=\"foo\", env=\"preprod\"} |= `my super logql`)");

    const [handleLogsLog2] = await once(logger, "info");
    assert.equal(handleLogsLog2, "[test1](state: handle|previous: 1|new: 1|next: 2|threshold: 4)");

    const [pollingLog2] = await once(logger, "info");
    assert.equal(pollingLog2, "[test1](state: polling start|polling: 1s|query: {app=\"foo\", env=\"preprod\"} |= `my super logql`)");

    const [handleLogsLog3] = await once(logger, "info");
    assert.equal(handleLogsLog3, "[test1](state: handle|previous: 2|new: 1|next: 3|threshold: 4)");

    const [pollingLog3] = await once(logger, "info");
    assert.equal(pollingLog3, "[test1](state: polling start|polling: 1s|query: {app=\"foo\", env=\"preprod\"} |= `my super logql`)");

    const [handleLogsLog4, alertLog] = await Promise.all([
      once(logger, "info"),
      once(logger, "err")
    ]);
    assert.equal(handleLogsLog4, "[test1](state: handle|previous: 3|new: 1|next: 4|threshold: 4)");
    assert.equal(alertLog, "[test1](state: alert|threshold: 4|actual: 4)");

    sheduler.stop();

    const [slackAlertNotif, discordAlertNotif] = getRuleAlertNotifs("test1");

    assert.equal(slackAlertNotif.notifier, "slack");
    assert.equal(slackAlertNotif.status, "success");

    assert.equal(discordAlertNotif.notifier, "discord");
    assert.equal(discordAlertNotif.status, "success");
  });
});

