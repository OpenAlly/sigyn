// Import Node.js Dependencies
import assert from "node:assert";
import { describe, it } from "node:test";

// Import Third-party Dependencies
import dayjs from "dayjs";

// Import Internal Dependencies
import * as utils from "../src/utils";

describe("Utils", () => {
  describe("durationToDate()", () => {
    it("should add one year", () => {
      const date = utils.durationToDate("1y", "add");

      assert.equal(date.get("y"), dayjs().add(1, "y").get("y"));
    });

    it("should subtract one year", () => {
      const date = utils.durationToDate("1y", "subtract");

      assert.equal(date.get("y"), dayjs().subtract(1, "y").get("y"));
    });
  });

  describe("ruleCountThresholdOperator", () => {
    const ruleCountThresholdOperatorTests: [number | string, utils.RuleCounterOperatorValue][] = [
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
        const [operator, count] = utils.ruleCountThresholdOperator(input);

        assert.equal(operator, expected[0]);
        assert.equal(count, expected[1]);
      });
    }

    it("should throw if the input is not a valid string", () => {
      assert.throws(() => {
        utils.ruleCountThresholdOperator("foo");
      }, {
        name: "Error",
        message: "Invalid count threshold format."
      });
    });

    it("should throw if the value is not valid", () => {
      assert.throws(() => {
        utils.ruleCountThresholdOperator(">= foo");
      }, {
        name: "Error",
        message: "Invalid count threshold format."
      });
    });

    it("should throw if the operator is not valid", () => {
      assert.throws(() => {
        utils.ruleCountThresholdOperator("foo 10");
      }, {
        name: "Error",
        message: "Invalid count threshold format."
      });
    });
  });

  describe("ruleCountMatchOperator()", () => {
    it("should return true if the operator is '>' and the counter is greater than the count", () => {
      assert.equal(utils.ruleCountMatchOperator(">", 10, 5), true);
    });

    it("should return true if the operator is '>=' and the counter is greater than or equal to the count", () => {
      assert.equal(utils.ruleCountMatchOperator(">=", 10, 10), true);
      assert.equal(utils.ruleCountMatchOperator(">=", 10, 5), true);
    });

    it("should return true if the operator is '<' and the counter is less than the count", () => {
      assert.equal(utils.ruleCountMatchOperator("<", 5, 10), true);
    });

    it("should return true if the operator is '<=' and the counter is less than or equal to the count", () => {
      assert.equal(utils.ruleCountMatchOperator("<=", 5, 10), true);
      assert.equal(utils.ruleCountMatchOperator("<=", 10, 10), true);
    });

    it("should return false if the operator is '>' and the counter is less than the count", () => {
      assert.equal(utils.ruleCountMatchOperator(">", 5, 10), false);
    });

    it("should return false if the operator is '>=' and the counter is less than the count", () => {
      assert.equal(utils.ruleCountMatchOperator(">=", 5, 10), false);
    });

    it("should return false if the operator is '<' and the counter is greater than the count", () => {
      assert.equal(utils.ruleCountMatchOperator("<", 10, 5), false);
    });

    it("should return false if the operator is '<=' and the counter is greater than the count", () => {
      assert.equal(utils.ruleCountMatchOperator("<=", 10, 5), false);
    });

    it("should throw if the operator is not valid", () => {
      assert.throws(() => {
        utils.ruleCountMatchOperator("foo" as utils.RuleCounterOperator, 10, 5);
      }, {
        name: "Error",
        message: "Invalid operator: foo"
      });
    });
  });
});
