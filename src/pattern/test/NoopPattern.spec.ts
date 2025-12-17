// Import Node.js Dependencies
import { describe, it } from "node:test";
import assert from "node:assert";

// Import Internal Dependencies
import { NoopPattern } from "../src/pattern.ts";

describe("NoopPattern", () => {
  describe("compile", () => {
    it("should return the same value but boxed in an Array", () => {
      const noop = new NoopPattern();

      const compiler = noop.compile();
      assert.deepEqual(
        compiler("foobar"),
        ["foobar"]
      );
    });
  });

  describe("executeOnLogs", () => {
    it("should return Array of logs without any modification (same ref)", () => {
      const input = ["A", "B"];

      const noop = new NoopPattern();
      const result = noop.executeOnLogs(input);
      assert.strictEqual(input, result);
    });
  });
});
