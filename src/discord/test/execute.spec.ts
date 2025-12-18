// Import Node.js Dependencies
import assert from "node:assert";
import { after, before, describe, it } from "node:test";

// Import Third-party Dependencies
import {
  MockAgent,
  MockPool,
  getGlobalDispatcher,
  setGlobalDispatcher
} from "@myunisoft/httpie";

// Import Internal Dependencies
import * as discord from "../src/index.ts";

const kMockAgent = new MockAgent();
const kDispatcher = getGlobalDispatcher();
const kDummyWebhoobURL = "https://foo.com";

describe("executeWebhook()", () => {
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

  it("should execute webhook", async() => {
    pool.intercept({
      method: "POST",
      path: "/"
    }).reply(200, { foo: "bar" });

    const { data } = await discord.execute({
      webhookUrl: kDummyWebhoobURL,
      data: {
        counter: 10,
        severity: "error",
        label: { foo: "bar" },
        labelCount: 0,
        labelMatchCount: 0
      },
      template: { title: "foo", content: [] }
    });

    assert.deepEqual(JSON.parse(data), { foo: "bar" });
  });

  it("should fail executing webhook when discord API rejects", async() => {
    pool.intercept({
      method: "POST",
      path: "/"
    }).reply(400, { message: "Unable to send webhook" });

    await assert.rejects(async() => await discord.execute({
      webhookUrl: kDummyWebhoobURL,
      data: {
        counter: 10,
        severity: "error",
        label: { foo: "bar" },
        labelCount: 0,
        labelMatchCount: 0
      },
      template: { title: "foo", content: [] }
    }), {
      name: "Error",
      message: "Bad Request"
    });
  });
});
