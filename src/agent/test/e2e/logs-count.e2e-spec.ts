// Import Node.js Dependencies
import { before, describe, it } from "node:test";
import assert from "node:assert";
import path from "node:path";
import { setTimeout } from "node:timers/promises";

// Import Internal Dependencies
import { TestingNotifier } from "../FT/mocks/sigyn-test-notifier";
import { setupEnvironment } from "./setup";
import { start } from "../../src";

// CONSTANTS
const kConfigLocation = path.join(__dirname, "./configs/count-logs");
const kTestingNotifier = TestingNotifier.getInstance();

describe("Given a rule with 'on.count: 1'", () => {
  before(async() => {
    process.env.GRAFANA_API_TOKEN = "toto";
    kTestingNotifier.clear();
  });

  it("Should send an alert when at least one log is found ", async() => {
    assert.equal(kTestingNotifier.notifCount, 0);

    const { fetchLoggingEndpoint, server } = await setupEnvironment({ grafanaHost: "https://localhost:3000" });
    await fetchLoggingEndpoint();

    const scheduler = await start(kConfigLocation);
    await setTimeout(10_000);
    try {
      assert.equal(kTestingNotifier.notifCount, 1);
      assert.ok(kTestingNotifier.toHaveBeenCalledWith({
        counter: 1,
        threshold: 1,
        lokiUrl: /^http:\/\/localhost:3030\/grafana\/explore\?orgId=1/
      }), "should have send 'counter: 1' because we have 1 log");
    }
    finally {
      scheduler.stop();
      await server.close();
    }
  });
});
