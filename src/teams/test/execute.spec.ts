// Import Node.js Dependencies
import assert from "node:assert";
import { after, before, describe, it } from "node:test";

// Import Third-party Dependencies
import { MockAgent, MockPool, getGlobalDispatcher, setGlobalDispatcher } from "@myunisoft/httpie";

// Import Internal Dependencies
import * as teams from "../src/index";

const kMockAgent = new MockAgent();
const kDispatcher = getGlobalDispatcher();
const kDummyWebhoobURL = "https://foo.com";

describe("execute()", () => {
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

  it("should throws if there is no title AND no content", async() => {
    await assert.rejects(async() => {
      await teams.execute({
        webhookUrl: kDummyWebhoobURL,
        data: {
          counter: 10,
          severity: "error",
          label: { foo: "bar" }
        },
        template: {} as any
      });
    }, {
      name: "Error",
      message: "Invalid rule template: one of the title or content is required."
    });
  });

  it("should execute webhook", async() => {
    pool.intercept({
      method: "POST",
      path: "/"
    }).reply(200, { foo: "bar" });

    const { data } = await teams.execute({
      webhookUrl: kDummyWebhoobURL,
      data: {
        counter: 10,
        severity: "error",
        label: { foo: "bar" }
      },
      template: { title: "foo" }
    });

    assert.deepEqual(JSON.parse(data), { foo: "bar" });
  });

  it("should fail executing webhook when Teams API rejects", async() => {
    pool.intercept({
      method: "POST",
      path: "/"
    }).reply(400, { message: "Unable to send webhook" });

    await assert.rejects(async() => await teams.execute({
      webhookUrl: kDummyWebhoobURL,
      data: {
        counter: 10,
        severity: "error",
        label: { foo: "bar" }
      },
      template: { title: "foo" }
    }), {
      name: "Error",
      message: "Bad Request"
    });
  });
});
