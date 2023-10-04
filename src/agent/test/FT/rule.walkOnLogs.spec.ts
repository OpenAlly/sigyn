// Import Node.js Dependencies
import assert from "node:assert";
import path from "node:path";
import fs from "node:fs";
import timers from "node:timers/promises";
import { after, before, describe, it } from "node:test";

// Import Third-party Dependencies
import dayjs from "dayjs";
import { SigynConfig, SigynRule, initConfig } from "@sigyn/config";
import { MockAgent, getGlobalDispatcher, setGlobalDispatcher } from "@myunisoft/httpie";

// Import Internal Dependencies
import { DbRule, DbRuleLabel, getDB, initDB } from "../../src/database";
import { MockLogger } from "./helpers";
import { Rule } from "../../src/rules";

// CONSTANTS
const kMultiPollingConfigLocation = path.join(__dirname, "/fixtures/multi-polling/sigyn.config.json");
const kLabelConfigLocation = path.join(__dirname, "/fixtures/label/sigyn.config.json");
const kLabelRangeValueConfigLocation = path.join(__dirname, "/fixtures/label-range-value/sigyn.config.json");
const kLabelValueMatchConfigLocation = path.join(__dirname, "/fixtures/label-value-match/sigyn.config.json");
const kLabelCountConfigLocation = path.join(__dirname, "/fixtures/label-count/sigyn.config.json");
const kLokiFixtureApiUrl = "http://localhost:3100";
const kMockAgent = new MockAgent();
const kGlobalDispatcher = getGlobalDispatcher();
const kLogger = new MockLogger();

function getRule(rule: SigynRule): DbRule {
  return getDB().prepare("SELECT * FROM rules WHERE name = ?").get(rule.name) as DbRule;
}

async function pollingIn200ms(rule: Rule, logs: string[], stream: Record<string, string> = {}): Promise<boolean> {
  const t0 = performance.now();

  const createAlert = await rule.walkOnLogs([{ values: logs, stream }]);

  const timeToHandleLogsInMs = Math.floor(performance.now() - t0);

  if (timeToHandleLogsInMs > 200) {
    throw new Error(`timeToHandleLogsInMs > 200 (${timeToHandleLogsInMs})`);
  }

  await timers.setTimeout(200 - timeToHandleLogsInMs);

  return createAlert;
}

function resetRuleCounter(rule: SigynRule): void {
  const db = getDB();
  db.transaction(() => {
    db.prepare("UPDATE rules SET counter = 0 WHERE name = ?").run(rule.name);
    db.prepare("DELETE FROM ruleLabels");
    db.prepare("DELETE FROM ruleLogs");
  })();
}

function createAlertInDB(rule: DbRule): void {
  getDB().prepare("INSERT INTO alerts (ruleId, createdAt) VALUES (?, ?)").run(rule.id, dayjs().valueOf());
  getDB().prepare("UPDATE ruleLogs SET processed = 1 WHERE ruleId = ?").run(rule.id);
}

describe("Rule.walkOnLogs()", () => {
  before(async() => {
    // we create a temp folder to store the test database
    fs.rmSync(".temp", { recursive: true, force: true, maxRetries: 5, retryDelay: 500 });
    fs.mkdirSync(".temp");

    process.env.GRAFANA_API_TOKEN = "toto";
    setGlobalDispatcher(kMockAgent);

    const pool = kMockAgent.get(kLokiFixtureApiUrl);
    pool.intercept({
      path: () => true
    }).reply(200);

    initDB(kLogger, { databaseFilename: ".temp/test.sqlite3", force: true });
  });

  after(() => {
    setGlobalDispatcher(kGlobalDispatcher);
  });

  describe("A rule with polling = '200ms', alert.on.count = 5 and alert.on.interval = '1s'", () => {
    let config: SigynConfig;

    before(async() => {
      config = await initConfig(kMultiPollingConfigLocation);
    });

    describe("When receiving one new log on each polling within the interval limit", () => {
      it("should send alert on 5th polling and reset count", async() => {
        const ruleConfig = config.rules[0];
        const rule = new Rule(ruleConfig, { logger: kLogger });
        rule.init();
        assert.equal(getRule(ruleConfig).counter, 0);

        let pollingCount = 0;
        while (pollingCount++ < 4) {
          const createAlert = await pollingIn200ms(rule, ["one new log"]);

          assert.equal(createAlert, false);
          assert.equal(getRule(ruleConfig).counter, pollingCount);
        }

        const createAlert = await pollingIn200ms(rule, ["one new log"]);

        assert.equal(createAlert, true);
        // once alert triggers, counter should be reset to 0
        assert.equal(getRule(ruleConfig).counter, 0);
      });
    });

    describe("When receiving one new log on each polling outside the interval limit", () => {
      it("should not send alert", async() => {
        const ruleConfig = config.rules[0];
        const rule = new Rule(ruleConfig, { logger: kLogger });
        rule.init();
        assert.equal(getRule(ruleConfig).counter, 0);

        let pollingCount = 0;
        while (pollingCount++ < 4) {
          const createAlert = await pollingIn200ms(rule, ["one new log outside interval limit"]);

          assert.equal(createAlert, false);
          assert.equal(getRule(ruleConfig).counter, pollingCount);
        }

        // counter is 4 in 800ms, we wait 200ms more to be outside the interval (it does 400ms because polling takes 200ms)
        assert.equal(getRule(ruleConfig).counter, 4);
        await timers.setTimeout(200);

        const createAlertAfter1200Ms = await pollingIn200ms(rule, ["one new log"]);

        // counter is still 4 because it has removed one counter added 1.200s later while interval is 1s
        assert.equal(createAlertAfter1200Ms, false);
        assert.equal(getRule(ruleConfig).counter, 4);

        const createAlertAfter1400Ms = await pollingIn200ms(rule, ["one new log"]);

        // counter is still 4 because it has removed one counter added 1.200s later while interval is 1s
        assert.equal(createAlertAfter1400Ms, false);
        assert.equal(getRule(ruleConfig).counter, 4);
      });
    });

    describe("When receiving 5 new logs on first polling", () => {
      it("should send alert and reset count", async() => {
        const ruleConfig = config.rules[0];
        const rule = new Rule(ruleConfig, { logger: kLogger });
        // need to reset counter because previous test has set it to 4 and didn't triggers alert so counter has not been reset
        resetRuleCounter(ruleConfig);

        assert.equal(getRule(ruleConfig).counter, 0);

        const createAlert = await pollingIn200ms(rule, Array.from(Array(5)).map(() => "one new log"));

        assert.equal(createAlert, true);
        // once alert triggers, counter should be reset to 0
        assert.equal(getRule(ruleConfig).counter, 0);
      });
    });

    describe("A rule with throttle.count = 6 and throttle.interval = '1s'", () => {
      describe("When receiving less logs than throttle.count within the interval", () => {
        it("should send a first alert", async() => {
          const ruleConfig = config.rules[0];
          const rule = new Rule(ruleConfig, { logger: kLogger });

          assert.equal(getRule(ruleConfig).counter, 0);

          const createAlert = await pollingIn200ms(rule, Array.from(Array(5)).map(() => "one new log"));

          assert.equal(createAlert, true);
          // once alert triggers, counter should be reset to 0
          assert.equal(getRule(ruleConfig).counter, 0);

          // Since throttle is based on alerts table, we need to create it ourself
          createAlertInDB(getRule(ruleConfig));
        });

        it("should not send another alert whithin interval and with less logs than count threshold", async() => {
          for (let i = 0; i < 5; i++) {
            const ruleConfig = config.rules[0];
            const rule = new Rule(ruleConfig, { logger: kLogger });

            assert.equal(getRule(ruleConfig).counter, 0);

            const createAlert = await pollingIn200ms(rule, Array.from(Array(5)).map(() => "one new log"));

            assert.equal(createAlert, false);
            assert.equal(getRule(ruleConfig).throttleCount, i + 1);
          }
        });

        it("should send another alert whithin interval and with more logs than count threshold", async() => {
          const ruleConfig = config.rules[0];
          const rule = new Rule(ruleConfig, { logger: kLogger });

          assert.equal(getRule(ruleConfig).counter, 0);

          const createAlert = await pollingIn200ms(rule, Array.from(Array(15)).map(() => "one new log"));

          assert.equal(createAlert, true);
          // once alert triggers, counter should be reset to 0
          assert.equal(getRule(ruleConfig).counter, 0);
        });
      });
    });

    describe("A rule with throttle.count = 6, throttle.interval = '2s' & throttle.activationThreshold = '5'", () => {
      let config: SigynConfig;
      let ruleConfig: SigynConfig["rules"][0];

      before(async() => {
        config = await initConfig(kMultiPollingConfigLocation);
        ruleConfig = {
          ...config.rules[0],
          name: "activation throttle",
          alert: {
            ...config.rules[0].alert,
            throttle: {
              ...config.rules[0].alert.throttle!,
              activationThreshold: 5,
              interval: "2s"
            }
          }
        };
      });

      describe("When receiving less logs than throttle.count within the interval", () => {
        it("should send a first alert", async() => {
          const rule = new Rule(ruleConfig, { logger: kLogger });
          rule.init();

          assert.equal(getRule(ruleConfig).counter, 0);

          const createAlert = await pollingIn200ms(rule, Array.from(Array(5)).map(() => "one new log"));

          assert.equal(createAlert, true);
          // once alert triggers, counter should be reset to 0
          assert.equal(getRule(ruleConfig).counter, 0);

          // Since throttle is based on alerts table, we need to create it ourself
          createAlertInDB(getRule(ruleConfig));
        });

        it("should send another alert until activationThreshold satisfies number of alerts", async() => {
          for (let i = 0; i < 5; i++) {
            const rule = new Rule(ruleConfig, { logger: kLogger });

            assert.equal(getRule(ruleConfig).counter, 0);

            const createAlert = await pollingIn200ms(rule, Array.from(Array(5)).map(() => "one new log"));

            assert.equal(createAlert, true);
            // once alert triggers, counter should be reset to 0
            assert.equal(getRule(ruleConfig).counter, 0);

            // Since throttle is based on alerts table, we need to create it ourself
            createAlertInDB(getRule(ruleConfig));
          }
        });

        // eslint-disable-next-line max-len
        it("should then activate threshold and not send another alert whithin interval and with less logs than count threshold", async() => {
          for (let i = 0; i < 5; i++) {
            const rule = new Rule(ruleConfig, { logger: kLogger });

            assert.equal(getRule(ruleConfig).counter, 0);

            const createAlert = await pollingIn200ms(rule, Array.from(Array(5)).map(() => "one new log"));

            assert.equal(createAlert, false);
            assert.equal(getRule(ruleConfig).throttleCount, i + 1);
          }
        });

        it("should then deactivate throttle when more logs than count threshold", async() => {
          const rule = new Rule(ruleConfig, { logger: kLogger });

          assert.equal(getRule(ruleConfig).counter, 0);

          const createAlert = await pollingIn200ms(rule, Array.from(Array(5)).map(() => "one new log"));

          assert.equal(createAlert, true);
          // once alert triggers, counter should be reset to 0
          assert.equal(getRule(ruleConfig).counter, 0);
        });
      });
    });

    describe("A rule with no throttle", () => {
      it("should send a first alert", async() => {
        const ruleConfig = { ...config.rules[0], alert: { ...config.rules[0].alert, throttle: undefined } };

        const rule = new Rule(ruleConfig, { logger: kLogger });

        assert.equal(getRule(ruleConfig).counter, 0);

        const createAlert = await pollingIn200ms(rule, Array.from(Array(5)).map(() => "one new log"));

        assert.equal(createAlert, true);
        // once alert triggers, counter should be reset to 0
        assert.equal(getRule(ruleConfig).counter, 0);

        // Since throttle is based on alerts table, we need to create it ourself
        createAlertInDB(getRule(ruleConfig));
      });

      it("should send each another alert", async() => {
        for (let i = 0; i < 3; i++) {
          const ruleConfig = { ...config.rules[0], alert: { ...config.rules[0].alert, throttle: undefined } };
          const rule = new Rule(ruleConfig, { logger: kLogger });

          assert.equal(getRule(ruleConfig).counter, 0);

          const createAlert = await pollingIn200ms(rule, Array.from(Array(5)).map(() => "one new log"));

          assert.equal(createAlert, true);
          // once alert triggers, counter should be reset to 0
          assert.equal(getRule(ruleConfig).counter, 0);
        }
      });
    });

    describe("A rule with a maximum count threshold (count < 50)", () => {
      it("should wait the whole interval before checking whether sending an alert", async() => {
        const ruleConfig = {
          ...config.rules[0],
          alert: {
            ...config.rules[0].alert,
            on: {
              ...config.rules[0].alert.on,
              count: "< 50"
            },
            throttle: undefined
          }
        };
        const rule = new Rule(ruleConfig, { logger: kLogger });

        assert.equal(getRule(ruleConfig).counter, 0);

        // since interval is 1s and polling is 200ms, need to do 5 polling to end the interval
        // 4 POLLINGS
        for (let i = 0; i < 4; i++) {
          const createAlert = await pollingIn200ms(rule, ["one log"]);

          assert.equal(createAlert, false);
          // once alert triggers, counter should be reset to 0
          assert.equal(getRule(ruleConfig).counter, i + 1);
        }

        // 5th POLLING
        assert.equal(getRule(ruleConfig).counter, 4);
        const createAlert = await pollingIn200ms(rule, ["one log should trigger alert"]);

        assert.equal(createAlert, true);
        // once alert triggers, counter should be reset to 0
        assert.equal(getRule(ruleConfig).counter, 0);
      });

      it("should not send alert after the interval ends as trehshold is lesser than logs count", async() => {
        const ruleConfig = {
          ...config.rules[0],
          alert: {
            ...config.rules[0].alert,
            on: {
              ...config.rules[0].alert.on,
              count: "< 50"
            },
            throttle: undefined
          }
        };
        const rule = new Rule(ruleConfig, { logger: kLogger });
        resetRuleCounter(ruleConfig);
        assert.equal(getRule(ruleConfig).counter, 0);

        // since interval is 1s and polling is 200ms, need to do 5 polling to end the interval
        // 4 POLLINGS
        for (let i = 0; i < 4; i++) {
          const createAlert = await pollingIn200ms(rule, Array.from(Array(10)).map(() => "one new log"));

          assert.equal(createAlert, false);
          // once alert triggers, counter should be reset to 0
          assert.equal(getRule(ruleConfig).counter, (i + 1) * 10);
        }

        // 5th POLLING
        assert.equal(getRule(ruleConfig).counter, 40);
        const createAlert = await pollingIn200ms(rule, Array.from(Array(10)).map(() => "one new log"));

        assert.equal(createAlert, false);
        assert.equal(getRule(ruleConfig).counter, 50);
      });
    });

    it("should store labels", async() => {
      const rule = new Rule(config.rules[0], { logger: kLogger });
      await rule.walkOnLogs([
        { values: ["one"], stream: { foo: "bar" } },
        { values: ["two"], stream: { foo: "baz", foz: "boz" } }
      ]);

      const labels = getDB().prepare("SELECT * FROM ruleLabels").all() as DbRuleLabel[];

      assert.equal(labels.length, 3);
      assert.deepEqual(labels.map((label) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { timestamp, ...labelWithouTimestamp } = label;

        return labelWithouTimestamp;
      }), [
        { id: 1, ruleId: 1, key: "foo", value: "bar" },
        { id: 2, ruleId: 1, key: "foo", value: "baz" },
        { id: 3, ruleId: 1, key: "foz", value: "boz" }
      ]);
    });

    it("should not store duplicate labels", async() => {
      getDB().exec("DELETE from ruleLabels");

      const rule = new Rule(config.rules[0], { logger: kLogger });

      await rule.walkOnLogs([
        { values: ["one"], stream: { foo: "bar" } },
        { values: ["two"], stream: { foo: "bar" } }
      ]);

      const labels = getDB().prepare("SELECT * FROM ruleLabels").all() as DbRuleLabel[];

      assert.equal(labels.length, 1);
      assert.equal(labels[0].id, 1);
      assert.equal(labels[0].ruleId, 1);
      assert.equal(labels[0].key, "foo");
      assert.equal(labels[0].value, "bar");
    });
  });

  describe("A rule based on percent threshold label matching", () => {
    let config: SigynConfig;

    before(async() => {
      config = await initConfig(kLabelConfigLocation);
    });

    it("should send alert when count and threshold reached", async() => {
      const rule = new Rule(config.rules[0], { logger: kLogger });
      rule.init();

      const createAlert = await pollingIn200ms(rule, Array.from(Array(10)).map(() => "one new log"), { state: "ko" });

      assert.equal(createAlert, true);
    });

    it("should not send alert when count not reached", async() => {
      const rule = new Rule(config.rules[0], { logger: kLogger });
      rule.clearLabels();

      const createAlert = await pollingIn200ms(rule, Array.from(Array(5)).map(() => "one new log"), { state: "ko" });

      assert.equal(createAlert, false);

      const createAlertWhenThrehsholdReached = await pollingIn200ms(
        rule,
        Array.from(Array(5)).map(() => "one new log"),
        { state: "ko" }
      );

      assert.equal(createAlertWhenThrehsholdReached, true);
    });

    it("should send alert when interval and threshold reached", async() => {
      const ruleConfig = {
        ...config.rules[0],
        alert: {
          ...config.rules[0].alert,
          on: {
            ...config.rules[0].alert.on,
            interval: "400ms"
          }
        }
      };
      const rule = new Rule(ruleConfig, { logger: kLogger });
      rule.clearLabels();

      const createAlert = await pollingIn200ms(rule, Array.from(Array(10)).map(() => "one new log"), { state: "ko" });

      assert.equal(createAlert, false);

      assert.equal(await pollingIn200ms(rule, []), false);

      // We need 3 intervals because there is some MS difference between the first polling and the first label timestamp
      const createAlertAfterIntervalReached = await pollingIn200ms(rule, []);
      assert.equal(createAlertAfterIntervalReached, true);
    });
  });

  describe("A rule based on percent threshold label matching a range value", () => {
    let config: SigynConfig;

    before(async() => {
      config = await initConfig(kLabelRangeValueConfigLocation);
    });

    it("should send alert when count and threshold reached", async() => {
      const rule = new Rule(config.rules[0], { logger: kLogger });
      rule.init();

      const createAlert = await pollingIn200ms(rule, Array.from(Array(10)).map(() => "one new log"), { responseTime: "1500" });

      assert.equal(createAlert, true);
    });

    it("should not send alert when count not reached", async() => {
      const rule = new Rule(config.rules[0], { logger: kLogger });
      rule.clearLabels();

      const createAlert = await pollingIn200ms(rule, Array.from(Array(5)).map(() => "one new log"), { responseTime: "1500" });

      assert.equal(createAlert, false);

      const createAlertWhenThrehsholdReached = await pollingIn200ms(
        rule,
        Array.from(Array(5)).map(() => "one new log"),
        { responseTime: "1500" }
      );

      assert.equal(createAlertWhenThrehsholdReached, true);
    });

    it("should send alert when interval and threshold reached", async() => {
      const ruleConfig = {
        ...config.rules[0],
        alert: {
          ...config.rules[0].alert,
          on: {
            ...config.rules[0].alert.on,
            interval: "400ms"
          }
        }
      };
      const rule = new Rule(ruleConfig, { logger: kLogger });
      rule.clearLabels();

      const createAlert = await pollingIn200ms(rule, Array.from(Array(10)).map(() => "one new log"), { responseTime: "1500" });

      assert.equal(createAlert, false);

      assert.equal(await pollingIn200ms(rule, []), false);

      // We need 3 intervals because there is some MS difference between the first polling and the first label timestamp
      const createAlertAfterIntervalReached = await pollingIn200ms(rule, []);
      assert.equal(createAlertAfterIntervalReached, true);
    });
  });

  describe("A rule based on percent threshold label matching valueMatch", () => {
    let config: SigynConfig;

    before(async() => {
      config = await initConfig(kLabelValueMatchConfigLocation);
    });

    it("should send alert when count and threshold reached", async() => {
      const rule = new Rule(config.rules[0], { logger: kLogger });
      rule.init();

      const createAlert = await pollingIn200ms(rule, Array.from(Array(10)).map(() => "one new log"), { statusCode: "500" });

      assert.equal(createAlert, true);
    });

    it("should not send alert when count not reached", async() => {
      const rule = new Rule(config.rules[0], { logger: kLogger });
      rule.clearLabels();

      const createAlert = await pollingIn200ms(rule, Array.from(Array(5)).map(() => "one new log"), { statusCode: "500" });

      assert.equal(createAlert, false);

      const createAlertWhenThrehsholdReached = await pollingIn200ms(
        rule,
        Array.from(Array(5)).map(() => "one new log"),
        { statusCode: "500" }
      );

      assert.equal(createAlertWhenThrehsholdReached, true);
    });

    it("should send alert when interval and threshold reached", async() => {
      const ruleConfig = {
        ...config.rules[0],
        alert: {
          ...config.rules[0].alert,
          on: {
            ...config.rules[0].alert.on,
            interval: "400ms"
          }
        }
      };
      const rule = new Rule(ruleConfig, { logger: kLogger });
      rule.clearLabels();

      const createAlert = await pollingIn200ms(rule, Array.from(Array(10)).map(() => "one new log"), { statusCode: "500" });

      assert.equal(createAlert, false);

      assert.equal(await pollingIn200ms(rule, []), false);

      // We need 3 intervals because there is some MS difference between the first polling and the first label timestamp
      const createAlertAfterIntervalReached = await pollingIn200ms(rule, []);
      assert.equal(createAlertAfterIntervalReached, true);
    });
  });

  describe("A rule based on count label", () => {
    let config: SigynConfig;

    before(async() => {
      config = await initConfig(kLabelCountConfigLocation);
    });

    it("should not send alert when count is not reached", async() => {
      const rule = new Rule(config.rules[0], { logger: kLogger });
      rule.init();

      const createAlert = await pollingIn200ms(rule, Array.from(Array(10)).map(() => "one new log"), { responseTime: "50" });

      assert.equal(createAlert, false);
    });

    it("should send alert when count is reached", async() => {
      const rule = new Rule(config.rules[0], { logger: kLogger });
      rule.init();

      const createAlert = await pollingIn200ms(rule, ["one new log"], { responseTime: "550" });

      assert.equal(createAlert, true);
    });
  });
});
