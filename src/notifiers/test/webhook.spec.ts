// Import Node.js Dependencies
import assert from "node:assert";
import { describe, it, after, before } from "node:test";

// Import Third-party Dependencies
import { MockAgent, MockPool, getGlobalDispatcher, setGlobalDispatcher } from "@myunisoft/httpie";

// Import Internal Dependencies
import { WebhookNotifier } from "../src/webhook";

const kMockAgent = new MockAgent();
const kDispatcher = getGlobalDispatcher();
const kDummyWebhoobURL = "https://webhook.test";

class DummyWebhookNotifier extends WebhookNotifier<{ foo: string }> {
  async formatWebhookBody() {
    return { foo: "bar" };
  }
}

describe("Webhook", () => {
  let pool: MockPool;

  before(() => {
    setGlobalDispatcher(kMockAgent);
    pool = kMockAgent.get(kDummyWebhoobURL);
    kMockAgent.disableNetConnect();
  });

  after(() => {
    kMockAgent.enableNetConnect();
    setGlobalDispatcher(kDispatcher);
  });

  it("should send a webhook", async() => {
    pool.intercept({
      method: "POST",
      path: "/dummy"
    }).reply(200);

    const notifier = new DummyWebhookNotifier({
      webhookUrl: "https://webhook.test/dummy",
      data: {
        severity: "critical",
        labelCount: 0,
        labelMatchCount: 1
      },
      template: {
        title: "Test",
        content: []
      }
    });

    const body = await notifier.formatWebhookBody();
    const response = await notifier.execute(
      body
    );

    assert.strictEqual(response.statusCode, 200);
  });
});
