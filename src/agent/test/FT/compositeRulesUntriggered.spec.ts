// Import Node.js Dependencies
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import { before, beforeEach, after, describe, it } from "node:test";
import { setTimeout } from "node:timers/promises";

// Import Third-party Dependencies
import { MockAgent, getGlobalDispatcher, setGlobalDispatcher } from "@myunisoft/httpie";
import { SigynInitializedConfig, initConfig } from "@sigyn/config";
import isCI from "is-ci";

// Import Internal Dependencies
import { getDB, initDB } from "../../src/database.js";
import { createRuleAlert, MockLogger, resetRuteMuteUntil, ruleMuteUntilTimestamp } from "./helpers.js";
import { handleCompositeRules } from "../../src/compositeRules.js";
import { Rule } from "../../src/rules.js";

// CONSTANTS
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const kUntriggeredCompositeRulesConfigLocation = path.join(
  __dirname,
  "/fixtures/composite-rules-no-mute-untriggered/sigyn.config.json"
);
const kLogger = new MockLogger();
const kMockAgent = new MockAgent();
const kGlobalDispatcher = getGlobalDispatcher();
// time to wait for the task to be fully executed (alert sent)
const kTimeout = isCI ? 350 : 200;

describe("Composite Rules with muteUntriggered falsy", () => {
  let config: SigynInitializedConfig;
  let rules: any;

  before(async() => {
    fs.mkdirSync(".temp", { recursive: true });

    initDB(kLogger, { databaseFilename: ".temp/test.sqlite3" });

    process.env.GRAFANA_API_TOKEN = "toto";
    setGlobalDispatcher(kMockAgent);

    const pool = kMockAgent.get("https://discord.com");
    pool.intercept({
      method: "POST",
      path: () => true
    }).reply(200);

    initDB(kLogger, { databaseFilename: ".temp/test-agent.sqlite3" });

    config = await initConfig(kUntriggeredCompositeRulesConfigLocation);
    rules = config.rules.map((ruleConfig) => {
      const rule = new Rule(ruleConfig, { logger: kLogger });
      rule.init();

      return rule;
    });
  });

  beforeEach(() => {
    getDB().prepare("DELETE FROM alerts").run();
  });

  after(() => {
    setGlobalDispatcher(kGlobalDispatcher);
  });

  it("should not mute rules that have not triggered alerts when muteUntrigged is false", async() => {
    resetRuteMuteUntil(rules[0]);
    resetRuteMuteUntil(rules[1]);
    resetRuteMuteUntil(rules[2]);

    getDB().prepare("DELETE FROM compositeRuleAlerts").run();

    assert.equal(ruleMuteUntilTimestamp(rules[0]), 0);
    assert.equal(ruleMuteUntilTimestamp(rules[1]), 0);
    assert.equal(ruleMuteUntilTimestamp(rules[2]), 0);

    createRuleAlert(rules[0], 5);
    createRuleAlert(rules[1], 5);
    // DO NOT SEND ALERTS FOR RULE 2
    // createRuleAlert(rules[2], 2);

    handleCompositeRules(kLogger);
    await setTimeout(kTimeout);

    assert.ok(ruleMuteUntilTimestamp(rules[0]) > Date.now());
    assert.ok(ruleMuteUntilTimestamp(rules[1]) > Date.now());
    assert.equal(ruleMuteUntilTimestamp(rules[2]), 0);
  });
});
