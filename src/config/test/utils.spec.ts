// Import Node.js Dependencies
import assert from "node:assert";
import { describe, it } from "node:test";

// Import Internal Dependencies
import * as utils from "../src/utils";
import { SigynRule } from "../src/types";

describe("Utils", () => {
  describe("mergeRulesLabelFilters()", () => {
    it("should create rule for each label filter", () => {
      const rules: Partial<SigynRule>[] = [
        {
          name: "foo",
          logql: "{app=\"foo\"} |= `my super logql`"
        },
        {
          name: "bar",
          logql: "{{label.env}} |= `my super logql`",
          labelFilters: {
            env: ["prod", "dev"]
          }
        },
        {
          name: "baz",
          logql: "{app=\"foo\", {label.env}} |= `my super logql`",
          labelFilters: {
            env: ["prod", "dev"]
          }
        }
      ];
      const expectedRules: Partial<SigynRule>[] = [
        {
          name: "foo",
          logql: "{app=\"foo\"} |= `my super logql`"
        },
        {
          name: "bar (env = prod)",
          logql: "{env=\"prod\"} |= `my super logql`",
          labelFilters: {
            env: ["prod", "dev"]
          }
        },
        {
          name: "bar (env = dev)",
          logql: "{env=\"dev\"} |= `my super logql`",
          labelFilters: {
            env: ["prod", "dev"]
          }
        },
        {
          name: "baz (env = prod)",
          logql: "{app=\"foo\", env=\"prod\"} |= `my super logql`",
          labelFilters: {
            env: ["prod", "dev"]
          }
        },
        {
          name: "baz (env = dev)",
          logql: "{app=\"foo\", env=\"dev\"} |= `my super logql`",
          labelFilters: {
            env: ["prod", "dev"]
          }
        }
      ];

      assert.deepEqual(utils.mergeRulesLabelFilters(rules as SigynRule[]), expectedRules);
    });
  });

  describe("fillLogqlLabelFilters()", () => {
    it("should add the label filter to a logql with existing labels", () => {
      const logql = "{app=\"foo\", {label.env}} |= `my super logql`";

      const result = utils.fillLogqlLabelFilters(logql, "env", "prod");
      assert.equal(result, "{app=\"foo\", env=\"prod\"} |= `my super logql`");
    });
  });
});
