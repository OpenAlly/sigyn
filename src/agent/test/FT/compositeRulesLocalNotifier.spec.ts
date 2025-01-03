// Import Node.js Dependencies
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import { before, beforeEach, describe, it } from "node:test";
import { setTimeout } from "node:timers/promises";

// Import Third-party Dependencies
import { SigynInitializedConfig, initConfig } from "@sigyn/config";
import isCI from "is-ci";

// Import Internal Dependencies
import { getDB, initDB } from "../../src/database.js";
import { createRuleAlert, MockLogger } from "./helpers.js";
import { handleCompositeRules } from "../../src/compositeRules.js";
import { Rule } from "../../src/rules.js";
import { TestingNotifier } from "./mocks/sigyn-test-notifier.js";

// CONSTANTS
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const kCompositeRulesConfigLocation = path.join(__dirname, "/fixtures/composite-rules-local/sigyn.config.json");
const kLogger = new MockLogger();
// time to wait for the task to be fully executed (alert sent)
const kTimeout = isCI ? 350 : 200;
const kTestingNotifier = TestingNotifier.getInstance();

describe("Composite Rules with Local Notifier", { concurrency: 1 }, () => {
  let config: SigynInitializedConfig;
  let rules: any;

  before(async() => {
    fs.mkdirSync(".temp", { recursive: true });

    initDB(kLogger, { databaseFilename: ".temp/test.sqlite3" });

    process.env.GRAFANA_API_TOKEN = "toto";

    initDB(kLogger, { databaseFilename: ".temp/test-agent.sqlite3" });

    config = await initConfig(kCompositeRulesConfigLocation);
    rules = config.rules.map((ruleConfig) => {
      const rule = new Rule(ruleConfig, { logger: kLogger });
      rule.init();

      return rule;
    });

    kTestingNotifier.clear();
  });

  beforeEach(() => {
    getDB().prepare("DELETE FROM alerts").run();
  });

  it("should includes rules that have triggered alert only", async() => {
    getDB().prepare("DELETE FROM compositeRuleAlerts").run();
    createRuleAlert(rules[0], 5);
    createRuleAlert(rules[1], 5);

    handleCompositeRules(kLogger);
    await setTimeout(kTimeout);

    const [notif] = kTestingNotifier.notifArguments;
    const { rules: notifedRules } = notif.data;

    assert.ok(notifedRules.includes(rules[0].getRuleFromDatabase().name), "Rule 0 has trigger alert so it should be included");
    assert.ok(notifedRules.includes(rules[1].getRuleFromDatabase().name), "Rule 1 has trigger alert so it should be included");
    assert.ok(
      notifedRules.includes(rules[2].getRuleFromDatabase().name) === false,
      "Rule 2 has not trigger alert so it should not be included"
    );
  });
});
