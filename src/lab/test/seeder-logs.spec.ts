// Import Node.js Dependencies
import { describe, it } from "node:test";
import assert from "node:assert";

// Import Internal Dependencies
import { LogGenerator } from "../src/seeder/logs.js";

describe("LogGenerator", () => {
  it("should generate 2 logs (one debug log + one random log)", (tc) => {
    // Mock so we have a deterministic test with 200 - info log
    tc.mock.method(global.Math, "random", () => 0.1);

    const logGenerator = new LogGenerator({ count: 1, mode: "formated" });
    const logs = [...logGenerator.generate()];
    assert.strictEqual(logs.length, 2);

    const [debugLog, infoLog] = logs;
    assert.deepStrictEqual(debugLog.stream, {
      level: "debug",
      format: "formated"
    });
    assert.deepStrictEqual(infoLog.stream, {
      level: "info",
      format: "formated"
    });
  });

  it("should generate mixed logs (formated and json)", () => {
    const logGenerator = new LogGenerator({ count: 200, mode: "random" });
    const logs = [...logGenerator.generate()];

    assert.ok(logs.find((log) => log.stream.format === "formated"));
    assert.ok(logs.find((log) => log.stream.format === "json"));
  });

  it("should generate formated logs", () => {
    const logGenerator = new LogGenerator({ count: 200, mode: "formated" });
    const logs = [...logGenerator.generate()];

    assert.ok(logs.every((log) => log.stream.format === "formated"));
  });

  it("should generate json logs", () => {
    const logGenerator = new LogGenerator({ count: 200, mode: "json" });
    const logs = [...logGenerator.generate()];

    assert.ok(logs.every((log) => log.stream.format === "json"));
  });
});

