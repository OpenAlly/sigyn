// Import Node.js Dependencies
import assert from "node:assert";
import { after, before, describe, it } from "node:test";

// Import Internal Dependencies
import * as utils from "../src/utils";
import { SigynConfig, SigynRule } from "../src/types";
import { MockAgent, getGlobalDispatcher, setGlobalDispatcher } from "@myunisoft/httpie";

// CONSTANTS
const kDummyUrl = "http://localhost:3000";
const kMockAgent = new MockAgent();
const kGlobalDispatcher = getGlobalDispatcher();

describe("Utils", () => {
  before(() => {
    process.env.GRAFANA_API_TOKEN = "toto";
    setGlobalDispatcher(kMockAgent);

    const pool = kMockAgent.get(kDummyUrl);
    pool.intercept({
      path: (path) => path.includes("env")
    }).reply(200, { data: ["prod", "dev"] }, { headers: { "Content-Type": "application/json" } }).persist();
  });

  after(() => {
    setGlobalDispatcher(kGlobalDispatcher);
  });

  describe("mergeRulesLabelFilters()", () => {
    it("should create rule for each label filter", async() => {
      const rules: Partial<SigynRule>[] = [
        {
          name: "foo",
          logql: "{app=\"foo\"} |= `my super logql`"
        },
        {
          name: "bar",
          logql: "{env={label.env}} |= `my super logql`",
          labelFilters: {
            env: ["prod", "dev"]
          }
        },
        {
          name: "baz",
          logql: "{app=\"foo\", env={label.env}} |= `my super logql`",
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
      const config = {
        loki: {
          apiUrl: kDummyUrl
        },
        rules
      };
      assert.deepEqual(await utils.mergeRulesLabelFilters(config as SigynConfig), expectedRules);
    });
  });

  describe("fetchRulesLabels()", () => {
    it("should fetch labels from Loki", async() => {
      const config: any = {
        loki: {
          apiUrl: kDummyUrl
        },
        rules: [
          {
            labelFilters: {
              env: ["foo"],
              app: ["foo"]
            }
          }
        ]
      };

      const labels = await utils.fetchRulesLabels(config);

      assert.equal(labels.size, 2);
      assert.deepEqual(labels.get("env"), ["prod", "dev"]);
      assert.equal(labels.get("foo"), undefined);
    });
  });
});
