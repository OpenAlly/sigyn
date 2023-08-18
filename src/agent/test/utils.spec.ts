// Import Node.js Dependencies
import assert from "node:assert";
import { after, before, describe, it } from "node:test";
import path from "node:path";

// Import Third-party Dependencies
import { initConfig, AlertSeverity } from "@sigyn/config";
import { MockAgent, getGlobalDispatcher, setGlobalDispatcher } from "@myunisoft/httpie";
import dayjs from "dayjs";

// Import Internal Dependencies
import * as utils from "../src/utils/index";
import { DEFAULT_POLLING } from "../src/rules";

// CONSTANTS
const kDummyUrl = "http://localhost:3000";
const kMockAgent = new MockAgent();
const kGlobalDispatcher = getGlobalDispatcher();

describe("Utils", () => {
  before(async() => {
    process.env.GRAFANA_API_TOKEN = "toto";
    setGlobalDispatcher(kMockAgent);

    const pool = kMockAgent.get(kDummyUrl);
    pool.intercept({
      path: (path) => path.includes("env")
    }).reply(200, { data: ["prod", "dev"] }, { headers: { "Content-Type": "application/json" } }).persist();

    await initConfig(path.join(__dirname, "FT/fixtures/sigyn.config.json"));
  });

  after(() => {
    setGlobalDispatcher(kGlobalDispatcher);
  });

  describe("durationOrCronToDate()", () => {
    it("should add one year", () => {
      const date = utils.cron.durationOrCronToDate("1y", "add");

      assert.equal(date.get("y"), dayjs().add(1, "y").get("y"));
    });

    it("should subtract one year", () => {
      const date = utils.cron.durationOrCronToDate("1y", "subtract");

      assert.equal(date.get("y"), dayjs().subtract(1, "y").get("y"));
    });
  });

  describe("countThresholdOperator", () => {
    const ruleCountThresholdOperatorTests: [number | string, utils.rules.RuleCounterOperatorValue][] = [
      ["10", [">=", 10]],
      [10, [">=", 10]],
      [">= 10", [">=", 10]],
      [">=10", [">=", 10]],
      [">=  10", [">=", 10]],
      [">=  10  ", [">=", 10]],
      ["  >=  10  ", [">=", 10]],
      ["> 10", [">", 10]],
      ["< 10", ["<", 10]],
      ["<= 10", ["<=", 10]],
      ["<=10", ["<=", 10]],
      ["<=  10", ["<=", 10]],
      ["<=  10  ", ["<=", 10]],
      ["  <=  10  ", ["<=", 10]],
      ["<  10  ", ["<", 10]]
    ];

    for (const [input, expected] of ruleCountThresholdOperatorTests) {
      it(`should return ${JSON.stringify(expected)} given "${input}"`, () => {
        const [operator, count] = utils.rules.countThresholdOperator(input);

        assert.equal(operator, expected[0]);
        assert.equal(count, expected[1]);
      });
    }

    it("should throw if the input is not a valid string", () => {
      assert.throws(() => {
        utils.rules.countThresholdOperator("foo");
      }, {
        name: "Error",
        message: "Invalid count threshold format."
      });
    });

    it("should throw if the value is not valid", () => {
      assert.throws(() => {
        utils.rules.countThresholdOperator(">= foo");
      }, {
        name: "Error",
        message: "Invalid count threshold format."
      });
    });

    it("should throw if the operator is not valid", () => {
      assert.throws(() => {
        utils.rules.countThresholdOperator("foo 10");
      }, {
        name: "Error",
        message: "Invalid count threshold format."
      });
    });
  });

  describe("countMatchOperator()", () => {
    it("should return true if the operator is '>' and the counter is greater than the count", () => {
      assert.equal(utils.rules.countMatchOperator(">", 10, 5), true);
    });

    it("should return true if the operator is '>=' and the counter is greater than or equal to the count", () => {
      assert.equal(utils.rules.countMatchOperator(">=", 10, 10), true);
      assert.equal(utils.rules.countMatchOperator(">=", 10, 5), true);
    });

    it("should return true if the operator is '<' and the counter is less than the count", () => {
      assert.equal(utils.rules.countMatchOperator("<", 5, 10), true);
    });

    it("should return true if the operator is '<=' and the counter is less than or equal to the count", () => {
      assert.equal(utils.rules.countMatchOperator("<=", 5, 10), true);
      assert.equal(utils.rules.countMatchOperator("<=", 10, 10), true);
    });

    it("should return false if the operator is '>' and the counter is less than the count", () => {
      assert.equal(utils.rules.countMatchOperator(">", 5, 10), false);
    });

    it("should return false if the operator is '>=' and the counter is less than the count", () => {
      assert.equal(utils.rules.countMatchOperator(">=", 5, 10), false);
    });

    it("should return false if the operator is '<' and the counter is greater than the count", () => {
      assert.equal(utils.rules.countMatchOperator("<", 10, 5), false);
    });

    it("should return false if the operator is '<=' and the counter is greater than the count", () => {
      assert.equal(utils.rules.countMatchOperator("<=", 10, 5), false);
    });

    it("should throw if the operator is not valid", () => {
      assert.throws(() => {
        utils.rules.countMatchOperator("foo" as utils.rules.RuleOperators, 10, 5);
      }, {
        name: "Error",
        message: "Invalid operator: foo"
      });
    });
  });

  describe("getPollings()", () => {
    it("should return a cron polling given a valid cron expression", () => {
      const [[isCron, polling]] = utils.rules.getPollings("*/5 * * * *");

      assert.equal(isCron, true);
      assert.equal(polling, "*/5 * * * *");
    });

    it("should be a valid cron expression given a cron with seconds (non-standard)", () => {
      const [[isCron, polling]] = utils.rules.getPollings("* * * * * *");

      assert.equal(isCron, true);
      assert.equal(polling, "* * * * * *");
    });

    it("should return a list of cron polling given a list of valid cron expression", () => {
      const pollings = utils.rules.getPollings([
        "*/10 * 15-15,38 * * *",
        "*/30 * 0-14 * * *",
        "*/30 * 15,39-23 * * *"
      ]);

      assert.equal(pollings.length, 3);

      for (const [isCron] of pollings) {
        assert.equal(isCron, true);
      }
    });

    it("should not return a cron", () => {
      const [[isCron, polling]] = utils.rules.getPollings("5m");

      assert.equal(isCron, false);
      assert.equal(polling, "5m");
    });

    it("should get default polling when no polling given", () => {
      const [[isCron, polling]] = utils.rules.getPollings();

      assert.equal(isCron, false);
      assert.equal(polling, DEFAULT_POLLING);
    });

    it("should throw when a polling in the list is not a valid cron expression", () => {
      assert.throws(() => {
        utils.rules.getPollings(["foo"]);
      }, {
        name: "Error",
        message: "All polling values must be cron expressions"
      });
    });

    it("should throw when given a list with a single polling that is not a valid cron expression", () => {
      assert.throws(() => {
        utils.rules.getPollings(["1m"]);
      }, {
        name: "Error",
        message: "All polling values must be cron expressions"
      });
    });
  });

  describe("getSeverity()", () => {
    const sev1: AlertSeverity[] = ["critical"];
    for (const sev of sev1) {
      it(`should return 'critical' when given ${sev}`, () => {
        assert.equal(utils.getSeverity(sev), "critical");
      });
    }

    const sev2: AlertSeverity[] = ["error", "major"];
    for (const sev of sev2) {
      it(`should return 'error' when given ${sev}`, () => {
        assert.equal(utils.getSeverity(sev), "error");
      });
    }

    const sev3: AlertSeverity[] = ["warning", "minor"];
    for (const sev of sev3) {
      it(`should return 'warning' when given ${sev}`, () => {
        assert.equal(utils.getSeverity(sev), "warning");
      });
    }

    const sev4: AlertSeverity[] = ["information", "info", "low"];
    for (const sev of sev4) {
      it(`should return 'info' when given ${sev}`, () => {
        assert.equal(utils.getSeverity(sev), "info");
      });
    }

    it("Default sevirity should be 'error'", () => {
      assert.equal(utils.getSeverity(undefined), "error");
    });
  });
});
