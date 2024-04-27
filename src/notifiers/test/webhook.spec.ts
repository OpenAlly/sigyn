// Import Node.js Dependencies
import assert from "node:assert";
import { describe, it, after, before, test } from "node:test";

// Import Third-party Dependencies
import { MockAgent, MockPool, getGlobalDispatcher, setGlobalDispatcher } from "@myunisoft/httpie";

// Import Internal Dependencies
import { WebhookNotifier } from "../src/webhook";

// CONSTANTS
const kMockAgent = new MockAgent();
const kDispatcher = getGlobalDispatcher();
const kDummyWebhoobURL = "https://webhook.test";

const kDummyNotifierOptions = {
  webhookUrl: "https://webhook.test/dummy",
  data: {
    severity: "critical",
    labelCount: 0,
    labelMatchCount: 1
  }
} as const;

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

  describe("formatTitle", () => {
    it("should format title using severity variable that we capitalize using morphix", async() => {
      const notifier = new DummyWebhookNotifier({
        ...kDummyNotifierOptions,
        template: {
          title: "foobar {severity | capitalize}",
          content: []
        }
      });

      const title = await notifier.formatTitle();
      assert.strictEqual(title, "💥 foobar Critical");
    });

    it("should remove Emoji from title when showSeverityEmoji is disabled", async() => {
      const notifier = new DummyWebhookNotifier({
        ...kDummyNotifierOptions,
        template: {
          title: "foobar",
          content: []
        }
      });
      notifier.showSeverityEmoji = false;

      const title = await notifier.formatTitle();
      assert.strictEqual(title, "foobar");
    });
  });

  describe("formatContent", () => {
    it("should format content injecting variables in it and formating with morphix when required", async() => {
      const notifier = new DummyWebhookNotifier({
        ...kDummyNotifierOptions,
        template: {
          title: "",
          content: [
            "labelCount: {labelCount}",
            "severity: {severity | capitalize}"
          ]
        }
      });

      const content = await notifier.formatContent();
      assert.deepEqual(
        content,
        ["labelCount: 0", "severity: Critical"]
      );
    });
  });

  test("execute should trigger an HTTP request", async() => {
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

class DummyWebhookNotifier extends WebhookNotifier<{ foo: string }> {
  async formatWebhookBody() {
    return { foo: "bar" };
  }
}
