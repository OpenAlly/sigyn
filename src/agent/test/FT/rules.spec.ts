// Import Node.js Dependencies
import assert from "node:assert";
import path from "node:path";
import url from "node:url";
import { before, describe, it } from "node:test";

// Import Third-party Dependencies
import dayjs from "dayjs";
import MockDate from "mockdate";
import { type SigynInitializedConfig, initConfig } from "@sigyn/config";

// Import Internal Dependencies
import { getDB, initDB } from "../../src/database.ts";
import { MockLogger } from "./helpers.ts";
import { Rule } from "../../src/rules.ts";

// CONSTANTS
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const kMultiPollingConfigLocation = path.join(__dirname, "/fixtures/multi-polling/sigyn.config.json");
const kLabelValueMatchConfigLocation = path.join(__dirname, "/fixtures/label-value-match/sigyn.config.json");
const kLogger = new MockLogger();

describe("Rule.getQueryRangeStartUnixTimestamp()", () => {
  let config: SigynInitializedConfig;

  before(async() => {
    process.env.GRAFANA_API_TOKEN = "toto";
    initDB(kLogger, { databaseFilename: ".temp/test-agent.sqlite3" });

    config = await initConfig(kMultiPollingConfigLocation);
  });

  describe("Given a cron polling '* 7-20 * * *' with a bounded polling strategy", () => {
    before(() => {
      config.rules[0].polling = "* 7-20 * * *";
      config.rules[0].pollingStrategy = "bounded";
    });

    const expected = [
      ["01-01-2023 18:00:00", "01-01-2023 17:59:00"],
      ["01-01-2023 17:32:00", "01-01-2023 17:31:00"],
      ["01-01-2023 20:00:00", "01-01-2023 19:59:00"],
      ["01-01-2023 13:27:00", "01-01-2023 13:26:00"],
      ["01-01-2023 7:01:00", "01-01-2023 7:00:00"],
      ["01-01-2023 9:10:00", "01-01-2023 9:09:00"],
      ["01-01-2023 12:17:00", "01-01-2023 12:16:00"],
      ["01-01-2023 15:55:00", "01-01-2023 15:54:00"]
    ];

    for (const [date, expectedResultDate] of expected) {
      it(`should return the previous interval (${expectedResultDate}) when date is ${date}`, () => {
        MockDate.set(date);

        const rule = new Rule(config.rules[0], { logger: kLogger });
        rule.init();
        const start = rule.getQueryRangeStartUnixTimestamp();

        assert.equal(start, dayjs(expectedResultDate).unix());
      });
    }

    it("should return null when date is 01-01-2023 07:00:00", () => {
      MockDate.set("01-01-2023 07:00:00");

      const rule = new Rule(config.rules[0], { logger: kLogger });
      const start = rule.getQueryRangeStartUnixTimestamp();

      assert.equal(start, null);
    });
  });

  describe("Given a cron polling '* 7-20 * * *' with an unbounded polling strategy", () => {
    before(() => {
      config.rules[0].polling = "* 7-20 * * *";
      config.rules[0].pollingStrategy = "unbounded";
    });

    const expected = [
      ["01-01-2023 18:00:00", "01-01-2023 17:59:00"],
      ["01-01-2023 17:32:00", "01-01-2023 17:31:00"],
      ["01-01-2023 20:00:00", "01-01-2023 19:59:00"],
      ["01-01-2023 13:27:00", "01-01-2023 13:26:00"],
      ["01-01-2023 7:01:00", "01-01-2023 7:00:00"],
      ["01-01-2023 9:10:00", "01-01-2023 9:09:00"],
      ["01-01-2023 12:17:00", "01-01-2023 12:16:00"],
      ["01-01-2023 15:55:00", "01-01-2023 15:54:00"]
    ];

    for (const [date, expectedResultDate] of expected) {
      it(`should return the previous interval (${expectedResultDate}) when date is ${date}`, () => {
        MockDate.set(date);

        const rule = new Rule(config.rules[0], { logger: kLogger });
        const start = rule.getQueryRangeStartUnixTimestamp();

        assert.equal(start, dayjs(expectedResultDate).unix());
      });
    }

    it("should return previous polling when date is 01-01-2023 07:00:00", () => {
      MockDate.set("01-01-2023 07:00:00");

      const rule = new Rule(config.rules[0], { logger: kLogger });
      const start = rule.getQueryRangeStartUnixTimestamp();

      assert.equal(start, dayjs("12-31-2022 20:59:00").unix());
    });
  });
});

describe("Rule.getAlertFormattedRule()", () => {
  let config: SigynInitializedConfig;

  before(async() => {
    initDB(kLogger, { databaseFilename: ".temp/test-agent.sqlite3" });

    config = await initConfig(kMultiPollingConfigLocation);
  });

  it("should return a rule with labels", async() => {
    getDB().exec("DELETE from ruleLabels");

    const rule = new Rule(config.rules[0], { logger: kLogger });
    rule.init();
    rule.walkOnLogs([
      { values: [[0, "one"]], labels: { foo: "bar" } },
      { values: [[0, "two"]], labels: { foo: "baz", foz: "boz" } }
    ]);

    const ruleWithLabels = rule.getAlertFormattedRule();

    assert.equal(Object.keys(ruleWithLabels.labels).length, 2);
    assert.equal(ruleWithLabels.labels.foo, "bar, baz");
    assert.equal(ruleWithLabels.labels.foz, "boz");
  });

  it("should return a rule without labels", async() => {
    getDB().exec("DELETE from ruleLabels");

    const rule = new Rule(config.rules[0], { logger: kLogger });
    const ruleWithLabels = rule.getAlertFormattedRule();

    assert.equal(Object.keys(ruleWithLabels.labels).length, 0);
  });

  it("labels should be distinct", async() => {
    getDB().exec("DELETE from ruleLabels");

    const rule = new Rule(config.rules[0], { logger: kLogger });
    rule.walkOnLogs([
      { values: [[0, "one"]], labels: { foo: "bar" } },
      { values: [[0, "two"]], labels: { foo: "baz", foz: "boz" } },
      { values: [[0, "three"]], labels: { foo: "baz", foz: "boz" } }
    ]);

    const ruleWithLabels = rule.getAlertFormattedRule();

    assert.equal(Object.keys(ruleWithLabels.labels).length, 2);
    assert.equal(ruleWithLabels.labels.foo, "bar, baz");
    assert.equal(ruleWithLabels.labels.foz, "boz");
  });

  it("when a rule is based on label, labels not matching rule should be skipped", async() => {
    const ruleConfig = await initConfig(kLabelValueMatchConfigLocation);
    getDB().exec("DELETE from ruleLabels");

    const rule = new Rule(ruleConfig.rules[0], { logger: kLogger });
    rule.init();
    // rule match statusCode 4xx & 5xx so the 200 should be skipped
    rule.walkOnLogs([
      { values: [[0, "statusCode: 200"]], labels: { statusCode: "200" } },
      { values: [[0, "statusCode: 400"]], labels: { statusCode: "400" } },
      { values: [[0, "statusCode: 500"]], labels: { statusCode: "500" } }
    ]);

    const ruleWithLabels = rule.getAlertFormattedRule();

    assert.equal(Object.keys(ruleWithLabels.labels).length, 1);
    assert.equal(ruleWithLabels.labels.statusCode, "400, 500");
  });
});
