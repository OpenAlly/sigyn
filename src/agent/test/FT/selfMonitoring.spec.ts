// Import Node.js Dependencies
import assert from "node:assert";
import path from "node:path";
import { after, afterEach, before, describe, it } from "node:test";
import { setTimeout } from "node:timers/promises";

// Import Third-party Dependencies
import { MockAgent, getGlobalDispatcher, setGlobalDispatcher } from "@myunisoft/httpie";
import { initConfig } from "@sigyn/config";
import isCI from "is-ci";

// Import Internal Dependencies
import { asyncTask } from "../../src/tasks/asyncTask";
import { MockLogger } from "./helpers";
import { Rule } from "../../src/rules";
import { getDB, initDB } from "../../src/database";

// CONSTANTS
const kFixturePath = path.join(__dirname, "/fixtures");
const kRuleConfigLocation = path.join(kFixturePath, "/self-monitoring/sigyn.config.json");
const kRuleNotMatchFiltersConfigLocation = path.join(kFixturePath, "/not-match-rule-filters/sigyn.config.json");
const kRuleMatchRuleFiltersConfigLocation = path.join(kFixturePath, "/no-self-monitoring-filters/sigyn.config.json");
const kRuleMatchErrorFiltersConfigLocation = path.join(kFixturePath, "/no-self-monitoring-filters/sigyn.config.json");
const kRuleNoFiltersConfigLocation = path.join(kFixturePath, "/no-self-monitoring-filters/sigyn.config.json");
const kRuleThrottleConfigLocation = path.join(kFixturePath, "/self-monitoring-throttle/sigyn.config.json");
const kRuleActivationThresholdConfigLocation = path.join(kFixturePath, "/self-monitoring-activation-threshold/sigyn.config.json");
const kLogger = new MockLogger();
const kMockLokiApi = {
  queryRangeStream() {
    throw new Error("Failed");
  }
};
const kMockAgent = new MockAgent();
const kGlobalDispatcher = getGlobalDispatcher();
// time to wait for the task to be fully executed (alert sent)
const kTimeout = isCI ? 350 : 200;

describe("Self-monitoring", () => {
  before(async() => {
    process.env.GRAFANA_API_TOKEN = "toto";
    setGlobalDispatcher(kMockAgent);
    kMockAgent.disableNetConnect();

    const pool = kMockAgent.get("https://discord.com");
    pool.intercept({
      method: "POST",
      path: () => true
    }).reply(200);
  });

  after(async() => {
    setGlobalDispatcher(kGlobalDispatcher);
  });

  afterEach(async() => {
    getDB().exec("DELETE FROM agentFailures");
  });

  it("should not send alert when error does not match errorFilters", async() => {
    initDB(kLogger, { databaseFilename: ".temp/test-agent.sqlite3" });
    const config = await initConfig(kRuleConfigLocation);
    const rule = new Rule(config.rules[0], { logger: kLogger });
    rule.init();

    const task = asyncTask(
      config.rules[0], {
        logger: kLogger,
        lokiApi: kMockLokiApi as any,
        rule
      }
    );

    assert.ok(task);
    task.execute();

    await setTimeout(kTimeout);

    assert.throws(() => kMockAgent.assertNoPendingInterceptors(), {
      name: "UndiciError",
      message: /1 interceptor is pending:/
    });
  });

  it("should not send alert when error does not match ruleFilters", async() => {
    initDB(kLogger, { databaseFilename: ".temp/test-agent.sqlite3" });
    const config = await initConfig(kRuleNotMatchFiltersConfigLocation);
    const rule = new Rule(config.rules[0], { logger: kLogger });
    rule.init();

    const task = asyncTask(
      config.rules[0], {
        logger: kLogger,
        lokiApi: kMockLokiApi as any,
        rule
      }
    );

    task.execute();

    await setTimeout(kTimeout);

    assert.throws(() => kMockAgent.assertNoPendingInterceptors(), {
      name: "UndiciError",
      message: /1 interceptor is pending:/
    });
  });

  it("should send alert as rule matches ruleFilters", async() => {
    initDB(kLogger, { databaseFilename: ".temp/test-agent.sqlite3" });
    const config = await initConfig(kRuleMatchRuleFiltersConfigLocation);
    const rule = new Rule(config.rules[0], { logger: kLogger });
    rule.init();

    const task = asyncTask(
      config.rules[0], {
        logger: kLogger,
        lokiApi: kMockLokiApi as any,
        rule
      }
    );

    task.execute();

    await setTimeout(kTimeout);

    assert.doesNotThrow(() => kMockAgent.assertNoPendingInterceptors());
  });

  // it("should send alert as rule matches errorFilters", async() => {
  //   initDB(kLogger, { databaseFilename: ".temp/test-agent.sqlite3" });
  //   const config = await initConfig(kRuleMatchErrorFiltersConfigLocation);
  //   const rule = new Rule(config.rules[0], { logger: kLogger });
  //   rule.init();

  //   const task = asyncTask(
  //     config.rules[0], {
  //       logger: kLogger,
  //       lokiApi: kMockLokiApi as any,
  //       rule
  //     }
  //   );

  //   task.execute();

  //   await setTimeout(kTimeout);

  //   assert.doesNotThrow(() => kMockAgent.assertNoPendingInterceptors());
  // });

  // it("should send alert as there are is no filter", async() => {
  //   initDB(kLogger, { databaseFilename: ".temp/test-agent.sqlite3" });
  //   const config = await initConfig(kRuleNoFiltersConfigLocation);
  //   const rule = new Rule(config.rules[0], { logger: kLogger });
  //   rule.init();

  //   const task = asyncTask(
  //     config.rules[0], {
  //       logger: kLogger,
  //       lokiApi: kMockLokiApi as any,
  //       rule
  //     }
  //   );

  //   task.execute();

  //   await setTimeout(kTimeout);

  //   assert.doesNotThrow(() => kMockAgent.assertNoPendingInterceptors());
  // });

  // it("should have throttle", async() => {
  //   initDB(kLogger, { databaseFilename: ".temp/test-agent.sqlite3" });
  //   const config = await initConfig(kRuleThrottleConfigLocation);
  //   const rule = new Rule(config.rules[0], { logger: kLogger });
  //   rule.init();

  //   const task = asyncTask(
  //     config.rules[0], {
  //       logger: kLogger,
  //       lokiApi: kMockLokiApi as any,
  //       rule
  //     }
  //   );
  //   task.execute();

  //   await setTimeout(kTimeout);

  //   assert.doesNotThrow(() => kMockAgent.assertNoPendingInterceptors());

  //   const pool = kMockAgent.get("https://discord.com");
  //   pool.intercept({
  //     method: "POST",
  //     path: () => true
  //   }).reply(200);

  //   task.execute();

  //   await setTimeout(kTimeout);

  //   assert.throws(() => kMockAgent.assertNoPendingInterceptors(), {
  //     name: "UndiciError",
  //     message: /1 interceptor is pending:/
  //   });

  //   task.execute();
  //   await setTimeout(kTimeout);
  //   assert.throws(() => kMockAgent.assertNoPendingInterceptors(), {
  //     name: "UndiciError",
  //     message: /1 interceptor is pending:/
  //   });

  //   task.execute();
  //   await setTimeout(kTimeout);

  //   // // We have throttle.count set to 3 so this alert should be sent
  //   assert.doesNotThrow(() => kMockAgent.assertNoPendingInterceptors());
  // });

  // it("should wait remaining activationThreshold (3) before activate throttle", async() => {
  //   const config = await initConfig(kRuleActivationThresholdConfigLocation);
  //   const rule = new Rule(config.rules[0], { logger: kLogger });
  //   rule.init();
  //   getDB().exec("DELETE FROM agentFailures");

  //   const task = asyncTask(
  //     config.rules[0], {
  //       logger: kLogger,
  //       lokiApi: kMockLokiApi as any,
  //       rule
  //     }
  //   );

  //   task.execute();
  //   await setTimeout(kTimeout);
  //   // first alert, no throttle (remaining: 2)
  //   assert.doesNotThrow(() => kMockAgent.assertNoPendingInterceptors());

  //   const pool = kMockAgent.get("https://discord.com");
  //   pool.intercept({
  //     method: "POST",
  //     path: () => true
  //   }).reply(200);

  //   task.execute();
  //   await setTimeout(kTimeout);

  //   // because of activationThreshold, no throttle (remaining: 1)
  //   assert.doesNotThrow(() => kMockAgent.assertNoPendingInterceptors());

  //   pool.intercept({
  //     method: "POST",
  //     path: () => true
  //   }).reply(200);
  //   task.execute();
  //   await setTimeout(kTimeout);

  //   // because of activationThreshold, no throttle (remaining: 0 -> now throttle is ON)
  //   assert.doesNotThrow(() => kMockAgent.assertNoPendingInterceptors());

  //   pool.intercept({
  //     method: "POST",
  //     path: () => true
  //   }).reply(200);

  //   task.execute();
  //   await setTimeout(kTimeout);
  //   // Now that throttle is activated (count = 3, 2 more to get OFF), alert not sent.
  //   assert.throws(() => kMockAgent.assertNoPendingInterceptors(), {
  //     name: "UndiciError",
  //     message: /1 interceptor is pending:/
  //   });

  //   task.execute();
  //   await setTimeout(kTimeout);
  //   // Throttle is still activated (count = 3, 1 more to get OFF), alert not sent.
  //   assert.throws(() => kMockAgent.assertNoPendingInterceptors(), {
  //     name: "UndiciError",
  //     message: /1 interceptor is pending:/
  //   });

  //   task.execute();
  //   await setTimeout(kTimeout);
  //   // Throttle is still activated (count = 3, 0 more, throttle is off now), alert not sent.
  //   assert.throws(() => kMockAgent.assertNoPendingInterceptors(), {
  //     name: "UndiciError",
  //     message: /1 interceptor is pending:/
  //   });

  //   // Throttle is OFF, alert sent again.
  //   task.execute();
  //   await setTimeout(kTimeout);
  //   assert.doesNotThrow(() => kMockAgent.assertNoPendingInterceptors());
  // });
});
