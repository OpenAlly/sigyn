// Import Node.js Dependencies
import assert from "node:assert";
import { after, before, describe, it } from "node:test";
import path from "node:path";
import url from "node:url";

// Import Third-party Dependencies
import { MockAgent, getGlobalDispatcher, setGlobalDispatcher } from "@myunisoft/httpie";

// Import Internal Dependencies
import { initConfig } from "../src";

// CONSTANTS
const kLokiFixtureApiUrl = "http://localhost:3100";
const kMockAgent = new MockAgent();
const kGlobalDispatcher = getGlobalDispatcher();

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

describe("Extended templates", () => {
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

  it("should extends the main template", async() => {
    const config = await initConfig(path.join(__dirname, "fixtures/extended-templates/sigyn.config.json"));

    assert.deepEqual(config.templates!, {
      main: {
        title: "🚨 {ruleName} - Triggered {counter} times!",
        content: [
          "- LogQL: {logql}",
          "- Threshold: {count}",
          "- Interval: {interval}"
        ]
      },
      test: {
        title: "🚨 {ruleName} - Triggered {counter} times!",
        content: [
          "- LogQL: {logql}",
          "- Threshold: {count}",
          "- Interval: {interval}",
          "- One more line"
        ]
      }
    });
  });

  it("should extends content with 'before'", async() => {
    const config = await initConfig(path.join(__dirname, "fixtures/extended-templates-content-before/sigyn.config.json"));

    assert.deepEqual(config.templates!, {
      main: {
        title: "🚨 {ruleName} - Triggered {counter} times!",
        content: [
          "- LogQL: {logql}",
          "- Threshold: {count}",
          "- Interval: {interval}"
        ]
      },
      test: {
        title: "🚨 {ruleName} - Triggered {counter} times!",
        content: [
          "foo",
          "- LogQL: {logql}",
          "- Threshold: {count}",
          "- Interval: {interval}"
        ]
      }
    });
  });

  it("should extends content with 'after'", async() => {
    const config = await initConfig(path.join(__dirname, "fixtures/extended-templates-content-after/sigyn.config.json"));

    assert.deepEqual(config.templates!, {
      main: {
        title: "🚨 {ruleName} - Triggered {counter} times!",
        content: [
          "- LogQL: {logql}",
          "- Threshold: {count}",
          "- Interval: {interval}"
        ]
      },
      test: {
        title: "🚨 {ruleName} - Triggered {counter} times!",
        content: [
          "- LogQL: {logql}",
          "- Threshold: {count}",
          "- Interval: {interval}",
          "foo"
        ]
      }
    });
  });

  it("should extends content with 'at'", async() => {
    const config = await initConfig(path.join(__dirname, "fixtures/extended-templates-content-at/sigyn.config.json"));

    assert.deepEqual(config.templates!, {
      main: {
        title: "🚨 {ruleName} - Triggered {counter} times!",
        content: [
          "- LogQL: {logql}",
          "- Threshold: {count}",
          "- Interval: {interval}"
        ]
      },
      test: {
        title: "🚨 {ruleName} - Triggered {counter} times!",
        content: [
          "- LogQL: {logql}",
          "- Threshold: {count}",
          "foo",
          "- Interval: {interval}"
        ]
      }
    });
  });

  it("should extends content with negative 'at'", async() => {
    const config = await initConfig(path.join(__dirname, "fixtures/extended-templates-content-at/sigyn.config.json"));

    assert.deepEqual(config.templates!, {
      main: {
        title: "🚨 {ruleName} - Triggered {counter} times!",
        content: [
          "- LogQL: {logql}",
          "- Threshold: {count}",
          "- Interval: {interval}"
        ]
      },
      test: {
        title: "🚨 {ruleName} - Triggered {counter} times!",
        content: [
          "- LogQL: {logql}",
          "- Threshold: {count}",
          "foo",
          "- Interval: {interval}"
        ]
      }
    });
  });

  it("should extends the nested templates", async() => {
    const config = await initConfig(path.join(__dirname, "fixtures/extended-templates-nested/sigyn.config.json"));

    assert.deepEqual(config.templates!, {
      main: {
        content: [
          "- LogQL: {logql}",
          "- Threshold: {count}",
          "- Interval: {interval}"
        ],
        title: "🚨 {ruleName} - Triggered {counter} times!"
      },
      test: {
        content: [
          "- LogQL: {logql}",
          "- Threshold: {count}",
          "- Interval: {interval}",
          "- One more line"
        ],
        title: "🚨 {ruleName} - Triggered {counter} times!"
      },
      test2: {
        content: [
          "- LogQL: {logql}",
          "- Threshold: {count}",
          "- Interval: {interval}",
          "- One more line",
          "- test2"
        ],
        title: "🚨 {ruleName} - Triggered {counter} times!"
      },
      test3: {
        content: [
          "- test3",
          "- LogQL: {logql}",
          "- Threshold: {count}",
          "- Interval: {interval}",
          "- One more line",
          "- test2"
        ],
        title: "🚨 {ruleName} - Triggered {counter} times!"
      },
      test4: {
        content: [
          "- test4",
          "- test3",
          "- LogQL: {logql}",
          "- Threshold: {count}",
          "- Interval: {interval}",
          "- One more line",
          "- test2"
        ],
        title: "TEST 4 TITLE"
      }
    });
  });
});
