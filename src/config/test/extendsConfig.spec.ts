// Import Node.js Dependencies
import assert from "node:assert";
import { after, before, describe, it } from "node:test";
import path from "node:path";

// Import Third-party Dependencies
import { MockAgent, getGlobalDispatcher, setGlobalDispatcher } from "@myunisoft/httpie";

// Import Internal Dependencies
import { initConfig } from "../src";

// CONSTANTS
const kLokiFixtureApiUrl = "http://localhost:3100";
const kMockAgent = new MockAgent();
const kGlobalDispatcher = getGlobalDispatcher();

describe("Extended configs", () => {
  before(() => {
    process.env.GRAFANA_API_TOKEN = "toto";
    setGlobalDispatcher(kMockAgent);

    const pool = kMockAgent.get(kLokiFixtureApiUrl);
    pool.intercept({
      path: () => true
    }).reply(200);
  });

  after(() => {
    setGlobalDispatcher(kGlobalDispatcher);
  });

  it("should extends the config", async() => {
    const config = await initConfig(path.join(__dirname, "fixtures/extended-configs/sigyn.config.json"));

    assert.deepEqual(config.templates!, {
      main: {
        title: "🚨 {ruleName} - Triggered {counter} times!",
        content: [
          "- LogQL: {logql}",
          "- Threshold: {count}",
          "- Interval: {interval}"
        ]
      },
      foo: {
        title: "🚨 {ruleName} - Triggered {counter} times!"
      }
    });

    assert.deepEqual(config.rules, [
      {
        name: "test1",
        logql: "{app=\"foo\", env=\"preprod\"} |= `my super logql`",
        polling: "1s",
        pollingStrategy: "unbounded",
        disabled: false,
        notifiers: ["discord"],
        alert: {
          on: {
            count: "1",
            interval: "1m"
          },
          template: {
            title: "🚨 {ruleName} - Triggered {counter} times!",
            content: [
              "- LogQL: {logql}",
              "- Threshold: {count}",
              "- Interval: {interval}"
            ]
          },
          severity: "error"
        }
      },
      {
        name: "fooRule",
        logql: "{app=\"foo\", env=\"preprod\"} |= `my super logql`",
        polling: "1s",
        pollingStrategy: "unbounded",
        disabled: false,
        notifiers: ["discord"],
        alert: {
          on: {
            count: "1",
            interval: "1m"
          },
          template: {
            title: "🚨 {ruleName} - Triggered {counter} times!"
          },
          severity: "error"
        }
      }
    ]);
  });
});
