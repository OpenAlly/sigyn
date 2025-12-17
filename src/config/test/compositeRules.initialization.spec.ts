// Import Node.js Dependencies
import assert from "node:assert";
import { describe, it } from "node:test";

// Import Third-party Dependencies

// Import Internal Dependencies
import * as utils from "../src/utils/index.ts";

// CONSTANTS

describe("Composite rules initialization", () => {
  describe("Given rules foo, bar & baz", () => {
    const rules = [
      { name: "foo", alert: { severity: "critical" } },
      { name: "bar", alert: { severity: "error" } },
      { name: "baz", alert: { severity: "info" } }
    ];

    it("Composite rule should match all rules when filters are not supplied", () => {
      const compositeRules = utils.compositeRules.initialize({
        rules,
        compositeRules: [
          {
            name: "foo",
            notifCount: 5,
            template: { title: "foo" }
          }
        ]
      } as any);

      assert.deepStrictEqual(compositeRules[0].rules, ["foo", "bar", "baz"]);
    });

    it("Composite rule should match foo, bar when include is not supplied and exclude is ['baz']", () => {
      const compositeRules = utils.compositeRules.initialize({
        rules,
        compositeRules: [
          {
            name: "foo",
            notifCount: 5,
            template: { title: "foo" },
            filters: {
              exclude: ["baz"]
            }
          }
        ]
      } as any);

      assert.deepStrictEqual(compositeRules[0].rules, ["foo", "bar"]);
    });

    it("Composite rule should match bar, baz when include is not supplied and exclude is ['f*']", () => {
      const compositeRules = utils.compositeRules.initialize({
        rules,
        compositeRules: [
          {
            name: "foo",
            notifCount: 5,
            template: { title: "foo" },
            filters: {
              exclude: ["f*"]
            }
          }
        ]
      } as any);

      assert.deepStrictEqual(compositeRules[0].rules, ["bar", "baz"]);
    });

    it("Composite rule should match bar, baz when include is ['b*'] and exclude is not supplied", () => {
      const compositeRules = utils.compositeRules.initialize({
        rules,
        compositeRules: [
          {
            name: "foo",
            notifCount: 5,
            template: { title: "foo" },
            filters: {
              include: ["b*"]
            }
          }
        ]
      } as any);

      assert.deepStrictEqual(compositeRules[0].rules, ["bar", "baz"]);
    });

    it("Composite rule should match bar, baz when include is ['b*', 'foo'] and exclude is ['foo']", () => {
      const compositeRules = utils.compositeRules.initialize({
        rules,
        compositeRules: [
          {
            name: "foo",
            notifCount: 5,
            template: { title: "foo" },
            filters: {
              include: ["b*", "foo"],
              exclude: ["foo"]
            }
          }
        ]
      } as any);

      assert.deepStrictEqual(compositeRules[0].rules, ["bar", "baz"]);
    });

    it("Composite rule should match bar, baz when severity is ['error', 'info']", () => {
      const compositeRules = utils.compositeRules.initialize({
        rules,
        compositeRules: [
          {
            name: "foo",
            notifCount: 5,
            template: { title: "foo" },
            filters: {
              severity: ["error", "info"]
            }
          }
        ]
      } as any);

      assert.deepStrictEqual(compositeRules[0].rules, ["bar", "baz"]);
    });

    it("Composite rule should match at least 2 rules", () => {
      assert.throws(() => {
        utils.compositeRules.initialize({
          rules,
          compositeRules: [
            {
              name: "foo",
              notifCount: 5,
              template: { title: "foo" },
              filters: {
                exclude: ["*"]
              }
            }
          ]
        } as any);
      }, {
        name: "Error",
        message: "Composite rule foo require at least 2 matching rules"
      });
    });

    it("Cannot have multiple composite rules matching the same set of rules", () => {
      assert.throws(() => {
        utils.compositeRules.initialize({
          rules,
          compositeRules: [
            {
              name: "foo",
              notifCount: 5,
              template: { title: "foo" }
            },
            {
              name: "bar",
              notifCount: 5,
              template: { title: "foo" }
            }
          ]
        } as any);
      }, {
        name: "Error",
        message: "Found multiple composite rules wich scope the same rules"
      });
    });

    it("Can have multiple composite rules matching different set of rules", () => {
      assert.doesNotThrow(() => {
        utils.compositeRules.initialize({
          rules,
          compositeRules: [
            {
              name: "foo",
              notifCount: 5,
              template: { title: "foo" }
            },
            {
              name: "bar",
              notifCount: 5,
              template: { title: "foo" },
              filters: {
                exclude: ["foo"]
              }
            }
          ]
        } as any);
      });
    });

    it("ruleCountThreshold cannot be higher than total matching rules", () => {
      assert.throws(() => {
        utils.compositeRules.initialize({
          rules,
          compositeRules: [
            {
              name: "foo",
              notifCount: 5,
              template: { title: "foo" },
              ruleCountThreshold: 15
            }
          ]
        } as any);
      }, {
        name: "Error",
        message: "ruleCountThreshold (15) cannot be higher than total rule (3)"
      });
    });
  });
});
