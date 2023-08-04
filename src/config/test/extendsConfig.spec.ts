// Import Node.js Dependencies
import assert from "node:assert";
import { describe, it } from "node:test";
import path from "node:path";

// Import Internal Dependencies
import { initConfig } from "../src";

describe("Extended configs", () => {
  it("should extends the config", () => {
    const config = initConfig(path.join(__dirname, "fixtures/extended-configs/sigyn.config.json"));

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
        alert: {
          on: {
            count: "1",
            interval: "1m"
          },
          template: "main"
        }
      },
      {
        name: "fooRule",
        logql: "{app=\"foo\", env=\"preprod\"} |= `my super logql`",
        polling: "1s",
        alert: {
          on: {
            count: "1",
            interval: "1m"
          },
          template: "foo"
        }
      }
    ]);
  });
});
