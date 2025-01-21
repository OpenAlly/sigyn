// Import Node.js Dependencies
import { describe, it } from "node:test";
import assert from "node:assert";

// Import Internal Dependencies
import { randomStatus } from "../src/seeder/http.js";

describe("randomStatus()", { concurrency: 1 }, () => {
  it("level should be critical when status is 500", (tc) => {
    tc.mock.method(global.Math, "random", () => 0.9);

    const { status, level } = randomStatus();

    assert.strictEqual(status, 500);
    assert.strictEqual(level, "critical");
  });

  it("level should be error when status is 400", (tc) => {
    tc.mock.method(global.Math, "random", () => 0.7);

    const { status, level } = randomStatus();

    assert.strictEqual(status, 400);
    assert.strictEqual(level, "error");
  });

  it("level should be info when status is 200", (tc) => {
    tc.mock.method(global.Math, "random", () => 0.1);

    const { status, level } = randomStatus();

    assert.strictEqual(status, 200);
    assert.strictEqual(level, "info");
  });
});
