// Import Node.js Dependencies
import assert from "node:assert";
import path from "node:path";
import { after, before, describe, it } from "node:test";
import { setTimeout } from "node:timers/promises";

// Import Third-party Dependencies
import { MockAgent, getGlobalDispatcher, setGlobalDispatcher } from "@myunisoft/httpie";
import { initConfig } from "@sigyn/config";

// Import Internal Dependencies
import { asyncTask } from "../../src/tasks/asyncTask";
import { MockLogger } from "./helpers";
import { Rule } from "../../src/rules";
import { initDB } from "../../src/database";

// CONSTANTS
const kRuleConfigLocation = path.join(__dirname, "/fixtures/self-monitoring/sigyn.config.json");
const kRuleNotMatchFiltersConfigLocation = path.join(__dirname, "/fixtures/not-match-rule-filters/sigyn.config.json");
const kRuleMatchRuleFiltersConfigLocation = path.join(__dirname, "/fixtures/no-self-monitoring-filters/sigyn.config.json");
const kRuleMatchErrorFiltersConfigLocation = path.join(__dirname, "/fixtures/no-self-monitoring-filters/sigyn.config.json");
const kRuleNoFiltersConfigLocation = path.join(__dirname, "/fixtures/no-self-monitoring-filters/sigyn.config.json");
const kRuleThrottleConfigLocation = path.join(__dirname, "/fixtures/self-monitoring-throttle/sigyn.config.json");
const kLogger = new MockLogger();
const kMockLokiApi = {
  queryRangeStream() {
    throw new Error("Failed");
  }
};
const kMockAgent = new MockAgent();
const kGlobalDispatcher = getGlobalDispatcher();

describe("Self-monitoring", () => {
  before(async() => {
    process.env.GRAFANA_API_TOKEN = "toto";
    setGlobalDispatcher(kMockAgent);

    const pool = kMockAgent.get("https://discord.com");
    pool.intercept({
      method: "POST",
      path: () => true
    }).reply(200);
  });

  after(() => {
    setGlobalDispatcher(kGlobalDispatcher);
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

    await setTimeout(200);

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

    await setTimeout(200);

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

    await setTimeout(200);

    assert.doesNotThrow(() => kMockAgent.assertNoPendingInterceptors());
  });

  it("should send alert as rule matches errorFilters", async() => {
    initDB(kLogger, { databaseFilename: ".temp/test-agent.sqlite3" });
    const config = await initConfig(kRuleMatchErrorFiltersConfigLocation);
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

    await setTimeout(200);

    assert.doesNotThrow(() => kMockAgent.assertNoPendingInterceptors());
  });

  it("should send alert as there are is no filter", async() => {
    initDB(kLogger, { databaseFilename: ".temp/test-agent.sqlite3" });
    const config = await initConfig(kRuleNoFiltersConfigLocation);
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

    await setTimeout(200);

    assert.doesNotThrow(() => kMockAgent.assertNoPendingInterceptors());
  });

  it("should have throttle", async() => {
    initDB(kLogger, { databaseFilename: ".temp/test-agent.sqlite3" });
    const config = await initConfig(kRuleThrottleConfigLocation);
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

    await setTimeout(200);

    assert.doesNotThrow(() => kMockAgent.assertNoPendingInterceptors());

    const pool = kMockAgent.get("https://discord.com");
    pool.intercept({
      method: "POST",
      path: () => true
    }).reply(200);

    task.execute();

    await setTimeout(200);

    assert.throws(() => kMockAgent.assertNoPendingInterceptors(), {
      name: "UndiciError",
      message: /1 interceptor is pending:/
    });

    task.execute();
    await setTimeout(200);
    assert.throws(() => kMockAgent.assertNoPendingInterceptors(), {
      name: "UndiciError",
      message: /1 interceptor is pending:/
    });

    task.execute();
    await setTimeout(200);
    assert.throws(() => kMockAgent.assertNoPendingInterceptors(), {
      name: "UndiciError",
      message: /1 interceptor is pending:/
    });

    task.execute();
    await setTimeout(200);

    // We have throttle.count set to 3 so this alert should be sent
    assert.doesNotThrow(() => kMockAgent.assertNoPendingInterceptors());
  });
});
