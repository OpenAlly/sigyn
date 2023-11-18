// Import Node.js Dependencies
import { describe, it } from "node:test";
import assert from "node:assert";

// Import Internal Dependencies
import { Pattern } from "../src/pattern.js";

describe("Pattern", () => {
  describe("static RegExp()", () => {
    it("should return new RegExp", () => {
      const regA = Pattern.RegExp();

      assert.ok(regA instanceof RegExp);
      assert.ok(regA !== Pattern.RegExp());
    });
  });

  describe("static escape", () => {
    it("should escape unsupported characters in string", () => {
      const result = Pattern.escape("[foo]");

      assert.strictEqual(result, "\\[foo\\]");
    });
  });

  describe("constructor", () => {
    it("constructor must accept array of patterns", () => {
      const parser = new Pattern([
        "[scope: <A>|<B>]",
        "[name: <name>]"
      ] as const);

      const logs = parser.executeOnLogs([
        "[scope: 10|20][name: Thomas]"
      ]);
      assert.strictEqual(logs.length, 1);

      const [parsedLog] = logs;
      assert.deepEqual(parsedLog, { A: "10", B: "20", name: "Thomas" });
    });
  });

  describe("compile", () => {
    it("should return a function that we can execute on one log at a time", () => {
      const parser = new Pattern("[scope: <A>|<B>]");

      const parseLog = parser.compile();
      assert.deepEqual(
        parseLog("[scope: 10|20]"),
        [{ A: "10", B: "20" }]
      );
    });

    it("should return an empty Array if the log doesn't match the pattern", () => {
      const parser = new Pattern("[scope: <A>|<B>]");

      const parseLog = parser.compile();
      assert.deepEqual(
        parseLog("hello world"),
        []
      );
    });
  });

  describe("RegExp fields", () => {
    it("should be able to parse 'all', 'httpMethod' and `httpStatusCode` fields", () => {
      const parser = new Pattern("<method> <endpoint> <statusCode>");

      const logs = parser.executeOnLogs([
        "GET https://github.com/OpenAlly 204"
      ]);
      assert.strictEqual(logs.length, 1);

      const [parsedLog] = logs;
      assert.deepEqual(
        parsedLog,
        {
          method: "GET",
          endpoint: "https://github.com/OpenAlly",
          statusCode: "204"
        }
      );
    });
  });
});
