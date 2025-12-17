// Import Node.js Dependencies
import assert from "node:assert";
import { describe, it } from "node:test";

// Import Internal Dependencies
import { StreamSelector } from "../src/streamSelector.ts";

describe("StreamSelector", () => {
  describe("constructor", () => {
    it("should handle a query", () => {
      const streamSelector = new StreamSelector("{app=\"foo\"}");

      assert.strictEqual(streamSelector.get("app")!.value, "foo");
    });

    it("should handle a query list", () => {
      const streamSelector = new StreamSelector(["{app=\"foo\"}", "{env=\"dev\"}"]);

      assert.strictEqual(streamSelector.get("app")!.value, "foo");
      assert.strictEqual(streamSelector.get("env")!.value, "dev");
    });

    it("should handle an iterable", () => {
      const streamSelector = new StreamSelector(new Map([["app", "foo"], ["env", "dev"]]));

      assert.strictEqual(streamSelector.get("app")!.value, "foo");
      assert.strictEqual(streamSelector.get("env")!.value, "dev");
    });

    it("should handle a Labels instance", () => {
      const streamSelector = new StreamSelector(new StreamSelector(new Map([["app", "foo"], ["env", "dev"]])));

      assert.strictEqual(streamSelector.get("app")!.value, "foo");
      assert.strictEqual(streamSelector.get("env")!.value, "dev");
    });

    it("should handle an object with string value", () => {
      const streamSelector = new StreamSelector({ foo: "bar" });

      assert.strictEqual(streamSelector.get("foo")!.value, "bar");
      assert.strictEqual(streamSelector.get("foo")!.operator, "=");
    });

    it("should handle an object with regexp value", () => {
      const streamSelector = new StreamSelector({ foo: /^bar/ });

      assert.strictEqual(streamSelector.get("foo")!.value, "^bar");
      assert.strictEqual(streamSelector.get("foo")!.operator, "=~");
    });

    it("should handle an object with StreamSelector.Equal string value", () => {
      const streamSelector = new StreamSelector({ foo: StreamSelector.Equal("bar") });

      assert.strictEqual(streamSelector.get("foo")!.value, "bar");
      assert.strictEqual(streamSelector.get("foo")!.operator, "=");
    });

    it("should handle an object with StreamSelector.Equal regexp value", () => {
      const streamSelector = new StreamSelector({ foo: StreamSelector.Equal(/^bar/) });

      assert.strictEqual(streamSelector.get("foo")!.value, "^bar");
      assert.strictEqual(streamSelector.get("foo")!.operator, "=~");
    });

    it("should handle an object with StreamSelector.Not string value", () => {
      const streamSelector = new StreamSelector({ foo: StreamSelector.Not("bar") });

      assert.strictEqual(streamSelector.get("foo")!.value, "bar");
      assert.strictEqual(streamSelector.get("foo")!.operator, "!=");
    });

    it("should handle an object with StreamSelector.Not regexp value", () => {
      const streamSelector = new StreamSelector({ foo: StreamSelector.Not(/^bar/) });

      assert.strictEqual(streamSelector.get("foo")!.value, "^bar");
      assert.strictEqual(streamSelector.get("foo")!.operator, "!~");
    });
  });

  describe("label matching operators", () => {
    it("should parse stict equal label", () => {
      const streamSelector = new StreamSelector("{app=\"foo\"}");

      assert.strictEqual(streamSelector.get("app")!.value, "foo");
      assert.strictEqual(streamSelector.get("app")!.operator, "=");

      assert.equal(streamSelector.size, 1);
    });

    it("should parse multiple stict equal labels", () => {
      const streamSelector = new StreamSelector("{app=\"foo\",env=\"dev\",job=\"bar\"}");

      assert.strictEqual(streamSelector.get("app")!.value, "foo");
      assert.strictEqual(streamSelector.get("app")!.operator, "=");

      assert.strictEqual(streamSelector.get("env")!.value, "dev");
      assert.strictEqual(streamSelector.get("env")!.operator, "=");

      assert.strictEqual(streamSelector.get("job")!.value, "bar");
      assert.strictEqual(streamSelector.get("job")!.operator, "=");

      assert.equal(streamSelector.size, 3);
    });

    it("should parse multiple stict equal labels with spaces", () => {
      const streamSelector = new StreamSelector("{app=\"foo\", env=\"dev\",   job=\"bar\"}");

      assert.strictEqual(streamSelector.get("app")!.value, "foo");
      assert.strictEqual(streamSelector.get("app")!.operator, "=");

      assert.strictEqual(streamSelector.get("env")!.value, "dev");
      assert.strictEqual(streamSelector.get("env")!.operator, "=");

      assert.strictEqual(streamSelector.get("job")!.value, "bar");
      assert.strictEqual(streamSelector.get("job")!.operator, "=");

      assert.equal(streamSelector.size, 3);
    });

    it("should parse not equal label", () => {
      const streamSelector = new StreamSelector("{app!=\"foo\"}");

      assert.strictEqual(streamSelector.get("app")!.value, "foo");
      assert.strictEqual(streamSelector.get("app")!.operator, "!=");

      assert.equal(streamSelector.size, 1);
    });

    it("should parse multiple not equal labels", () => {
      const streamSelector = new StreamSelector("{app!=\"foo\",env!=\"dev\",job!=\"bar\"}");

      assert.strictEqual(streamSelector.get("app")!.value, "foo");
      assert.strictEqual(streamSelector.get("app")!.operator, "!=");

      assert.strictEqual(streamSelector.get("env")!.value, "dev");
      assert.strictEqual(streamSelector.get("env")!.operator, "!=");

      assert.strictEqual(streamSelector.get("job")!.value, "bar");
      assert.strictEqual(streamSelector.get("job")!.operator, "!=");

      assert.equal(streamSelector.size, 3);
    });

    it("should parse multiple not equal labels with spaces", () => {
      const streamSelector = new StreamSelector("{app!=\"foo\", env!=\"dev\",   job!=\"bar\"}");

      assert.strictEqual(streamSelector.get("app")!.value, "foo");
      assert.strictEqual(streamSelector.get("app")!.operator, "!=");

      assert.strictEqual(streamSelector.get("env")!.value, "dev");
      assert.strictEqual(streamSelector.get("env")!.operator, "!=");

      assert.strictEqual(streamSelector.get("job")!.value, "bar");
      assert.strictEqual(streamSelector.get("job")!.operator, "!=");

      assert.equal(streamSelector.size, 3);
    });

    it("should parse regexMatches label", () => {
      const streamSelector = new StreamSelector("{app=~\"fo[oz]\"}");

      assert.strictEqual(streamSelector.get("app")!.value, "fo[oz]");
      assert.strictEqual(streamSelector.get("app")!.operator, "=~");

      assert.equal(streamSelector.size, 1);
    });

    it("should parse multiple regexMatches labels", () => {
      const streamSelector = new StreamSelector("{app=~\"fo[oz]\",job=~\"ba[rz]\"}");

      assert.strictEqual(streamSelector.get("app")!.value, "fo[oz]");
      assert.strictEqual(streamSelector.get("app")!.operator, "=~");

      assert.strictEqual(streamSelector.get("job")!.value, "ba[rz]");
      assert.strictEqual(streamSelector.get("job")!.operator, "=~");

      assert.equal(streamSelector.size, 2);
    });

    it("should parse multiple regexMatches labels with spaces", () => {
      const streamSelector = new StreamSelector("{app=~\"fo[oz]\", env=~\"(?:pre)?prod\",    job=~\"ba[rz]\"}");

      assert.strictEqual(streamSelector.get("app")!.value, "fo[oz]");
      assert.strictEqual(streamSelector.get("app")!.operator, "=~");

      assert.strictEqual(streamSelector.get("env")!.value, "(?:pre)?prod");
      assert.strictEqual(streamSelector.get("env")!.operator, "=~");

      assert.strictEqual(streamSelector.get("job")!.value, "ba[rz]");
      assert.strictEqual(streamSelector.get("job")!.operator, "=~");

      assert.equal(streamSelector.size, 3);
    });

    it("should parse regexDoesNotMatch label", () => {
      const streamSelector = new StreamSelector("{app!~\"fo[oz]\"}");

      assert.strictEqual(streamSelector.get("app")!.value, "fo[oz]");
      assert.strictEqual(streamSelector.get("app")!.operator, "!~");

      assert.equal(streamSelector.size, 1);
    });

    it("should parse multiple regexDoesNotMatch labels", () => {
      const streamSelector = new StreamSelector("{app!~\"fo[oz]\",job!~\"ba[rz]\"}");

      assert.strictEqual(streamSelector.get("app")!.value, "fo[oz]");
      assert.strictEqual(streamSelector.get("app")!.operator, "!~");

      assert.strictEqual(streamSelector.get("job")!.value, "ba[rz]");
      assert.strictEqual(streamSelector.get("job")!.operator, "!~");

      assert.equal(streamSelector.size, 2);
    });

    it("should parse multiple regexDoesNotMatch labels with spaces", () => {
      const streamSelector = new StreamSelector("{app!~\"fo[oz]\", env!~\"(?:pre)?prod\",    job!~\"ba[rz]\"}");

      assert.strictEqual(streamSelector.get("app")!.value, "fo[oz]");
      assert.strictEqual(streamSelector.get("app")!.operator, "!~");

      assert.strictEqual(streamSelector.get("env")!.value, "(?:pre)?prod");
      assert.strictEqual(streamSelector.get("env")!.operator, "!~");

      assert.strictEqual(streamSelector.get("job")!.value, "ba[rz]");
      assert.strictEqual(streamSelector.get("job")!.operator, "!~");

      assert.equal(streamSelector.size, 3);
    });

    it("should parse each label matching operator", () => {
      const streamSelector = new StreamSelector("{foo=\"foo\",bar!=\"bar\",foz=~\"fo[oz]\",baz!~\"ba[rz]\"}");

      assert.strictEqual(streamSelector.get("foo")!.value, "foo");
      assert.strictEqual(streamSelector.get("foo")!.operator, "=");

      assert.strictEqual(streamSelector.get("bar")!.value, "bar");
      assert.strictEqual(streamSelector.get("bar")!.operator, "!=");

      assert.strictEqual(streamSelector.get("foz")!.value, "fo[oz]");
      assert.strictEqual(streamSelector.get("foz")!.operator, "=~");

      assert.strictEqual(streamSelector.get("baz")!.value, "ba[rz]");
      assert.strictEqual(streamSelector.get("baz")!.operator, "!~");

      assert.equal(streamSelector.size, 4);
    });
  });

  describe("toString()", () => {
    it("should stringify exactlyEqual label", () => {
      const streamSelector = new StreamSelector("{foo=\"foo\"}");

      assert.strictEqual(streamSelector.toString(), "{foo=\"foo\"}");
    });

    it("should stringify notEqual label", () => {
      const streamSelector = new StreamSelector("{foo!=\"foo\"}");

      assert.strictEqual(streamSelector.toString(), "{foo!=\"foo\"}");
    });

    it("should stringify regexMatches label", () => {
      const streamSelector = new StreamSelector("{foo=~\"fo[oz]\"}");

      assert.strictEqual(streamSelector.toString(), "{foo=~\"fo[oz]\"}");
    });

    it("should stringify regexDoesNotMatch label", () => {
      const streamSelector = new StreamSelector("{foo!~\"fo[oz]\"}");

      assert.strictEqual(streamSelector.toString(), "{foo!~\"fo[oz]\"}");
    });

    it("should stringify multiple labels", () => {
      const streamSelector = new StreamSelector("{foo=\"foo\",bar!=\"bar\",foz=~\"fo[oz]\",baz!~\"ba[rz]\"}");

      assert.strictEqual(streamSelector.toString(), "{foo=\"foo\",bar!=\"bar\",foz=~\"fo[oz]\",baz!~\"ba[rz]\"}");
    });

    it("should stringify a given object with string value", () => {
      const streamSelector = new StreamSelector({ foo: "bar" });

      assert.strictEqual(streamSelector.toString(), "{foo=\"bar\"}");
    });

    it("should stringify a given object with regexp value", () => {
      const streamSelector = new StreamSelector({ foo: /^bar/ });

      assert.strictEqual(streamSelector.toString(), "{foo=~\"^bar\"}");
    });

    it("should stringify a given object with StreamSelector.Equal string value", () => {
      const streamSelector = new StreamSelector({ foo: StreamSelector.Equal("bar") });

      assert.strictEqual(streamSelector.toString(), "{foo=\"bar\"}");
    });

    it("should stringify a given object with StreamSelector.Equal regexp value", () => {
      const streamSelector = new StreamSelector({ foo: StreamSelector.Equal(/^bar/) });

      assert.strictEqual(streamSelector.toString(), "{foo=~\"^bar\"}");
    });

    it("should stringify a given object with StreamSelector.Not string value", () => {
      const streamSelector = new StreamSelector({ foo: StreamSelector.Not("bar") });

      assert.strictEqual(streamSelector.toString(), "{foo!=\"bar\"}");
    });

    it("should stringify a given object with StreamSelector.Not regexp value", () => {
      const streamSelector = new StreamSelector({ foo: StreamSelector.Not(/^bar/) });

      assert.strictEqual(streamSelector.toString(), "{foo!~\"^bar\"}");
    });
  });

  describe("toJSON()", () => {
    it("should return empty object", () => {
      const streamSelector = new StreamSelector();

      assert.deepEqual(streamSelector.toJSON(), {});
    });

    it("should return stream selectors with operator", () => {
      const streamSelector = new StreamSelector("{foo=\"foo\",bar!=\"bar\",foz=~\"fo[oz]\",baz!~\"ba[rz]\"}");

      assert.deepEqual(streamSelector.toJSON(), {
        foo: { operator: "=", value: "foo" },
        bar: { operator: "!=", value: "bar" },
        foz: { operator: "=~", value: "fo[oz]" },
        baz: { operator: "!~", value: "ba[rz]" }
      });
    });
  });

  describe("kv()", () => {
    it("should return empty object", () => {
      const streamSelector = new StreamSelector();

      assert.deepEqual(streamSelector.kv(), {});
    });

    it("should return stream selectors without operator", () => {
      const streamSelector = new StreamSelector("{foo=\"foo\",bar!=\"bar\",foz=~\"fo[oz]\",baz!~\"ba[rz]\"}");

      assert.deepEqual(streamSelector.kv(), {
        foo: "foo",
        bar: "bar",
        foz: "fo[oz]",
        baz: "ba[rz]"
      });
    });
  });

  describe("Building", () => {
    it("should add exactlyEqual label", () => {
      const streamSelector = new StreamSelector();

      streamSelector.set("foo", "foo");

      assert.strictEqual(streamSelector.get("foo")!.value, "foo");
      assert.strictEqual(streamSelector.get("foo")!.operator, "=");

      assert.equal(streamSelector.size, 1);

      assert.strictEqual(streamSelector.toString(), "{foo=\"foo\"}");
    });

    it("should add exactlyEqual label given operator", () => {
      const streamSelector = new StreamSelector();

      streamSelector.set("foo", "foo", "=");

      assert.strictEqual(streamSelector.get("foo")!.value, "foo");
      assert.strictEqual(streamSelector.get("foo")!.operator, "=");

      assert.equal(streamSelector.size, 1);

      assert.strictEqual(streamSelector.toString(), "{foo=\"foo\"}");
    });

    it("should add exactlyEqual label given an object", () => {
      const streamSelector = new StreamSelector();

      streamSelector.set("foo", { value: "foo", operator: "=" });

      assert.strictEqual(streamSelector.get("foo")!.value, "foo");
      assert.strictEqual(streamSelector.get("foo")!.operator, "=");

      assert.equal(streamSelector.size, 1);

      assert.strictEqual(streamSelector.toString(), "{foo=\"foo\"}");
    });

    it("should add notEqual label", () => {
      const streamSelector = new StreamSelector();

      streamSelector.set("foo", "foo", "!=");

      assert.strictEqual(streamSelector.get("foo")!.value, "foo");
      assert.strictEqual(streamSelector.get("foo")!.operator, "!=");

      assert.equal(streamSelector.size, 1);

      assert.strictEqual(streamSelector.toString(), "{foo!=\"foo\"}");
    });

    it("should add notEqual label given an object", () => {
      const streamSelector = new StreamSelector();

      streamSelector.set("foo", { value: "foo", operator: "!=" });

      assert.strictEqual(streamSelector.get("foo")!.value, "foo");
      assert.strictEqual(streamSelector.get("foo")!.operator, "!=");

      assert.equal(streamSelector.size, 1);

      assert.strictEqual(streamSelector.toString(), "{foo!=\"foo\"}");
    });

    it("should add regexMatches label", () => {
      const streamSelector = new StreamSelector();

      streamSelector.set("foo", "fo[oz]", "=~");

      assert.strictEqual(streamSelector.get("foo")!.value, "fo[oz]");
      assert.strictEqual(streamSelector.get("foo")!.operator, "=~");

      assert.equal(streamSelector.size, 1);

      assert.strictEqual(streamSelector.toString(), "{foo=~\"fo[oz]\"}");
    });

    it("should add regexMatches label given an object", () => {
      const streamSelector = new StreamSelector();

      streamSelector.set("foo", { value: "fo[oz]", operator: "=~" });

      assert.strictEqual(streamSelector.get("foo")!.value, "fo[oz]");
      assert.strictEqual(streamSelector.get("foo")!.operator, "=~");

      assert.equal(streamSelector.size, 1);

      assert.strictEqual(streamSelector.toString(), "{foo=~\"fo[oz]\"}");
    });

    it("should add regexDoesNotMatch label", () => {
      const streamSelector = new StreamSelector();

      streamSelector.set("foo", "fo[oz]", "!~");

      assert.strictEqual(streamSelector.get("foo")!.value, "fo[oz]");
      assert.strictEqual(streamSelector.get("foo")!.operator, "!~");

      assert.equal(streamSelector.size, 1);

      assert.strictEqual(streamSelector.toString(), "{foo!~\"fo[oz]\"}");
    });

    it("should add regexDoesNotMatch label given an object", () => {
      const streamSelector = new StreamSelector();

      streamSelector.set("foo", { value: "fo[oz]", operator: "!~" });

      assert.strictEqual(streamSelector.get("foo")!.value, "fo[oz]");
      assert.strictEqual(streamSelector.get("foo")!.operator, "!~");

      assert.equal(streamSelector.size, 1);

      assert.strictEqual(streamSelector.toString(), "{foo!~\"fo[oz]\"}");
    });
  });
});
