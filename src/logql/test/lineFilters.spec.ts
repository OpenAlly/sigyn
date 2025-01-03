// Import Node.js Dependencies
import assert from "node:assert";
import { describe, it } from "node:test";

// Import Internal Dependencies
import { LineFilters } from "../src/lineFilters.js";

describe("LineFilters", () => {
  describe("parsing", () => {
    it("should parse a lineContains with backtick", () => {
      const lineFilters = new LineFilters("|= `foo`");

      assert.equal(lineFilters.lineContains().length, 1);
      assert.strictEqual(lineFilters.lineContains()[0], "foo");
    });

    it("should parse a lineContains with quote", () => {
      const lineFilters = new LineFilters("|= 'foo'");

      assert.equal(lineFilters.lineContains().length, 1);
      assert.strictEqual(lineFilters.lineContains()[0], "foo");
    });

    it("should parse multiple lineContains", () => {
      const lineFilters = new LineFilters("|= `foo` |= `bar`");

      assert.equal(lineFilters.lineContains().length, 2);
      assert.strictEqual(lineFilters.lineContains()[0], "foo");
      assert.strictEqual(lineFilters.lineContains()[1], "bar");
    });

    it("should parse a lineDoesNotContain with backtick", () => {
      const lineFilters = new LineFilters("!= `foo`");

      assert.equal(lineFilters.lineDoesNotContain().length, 1);
      assert.strictEqual(lineFilters.lineDoesNotContain()[0], "foo");
    });

    it("should parse a lineDoesNotContain with quote", () => {
      const lineFilters = new LineFilters("!= 'foo'");

      assert.equal(lineFilters.lineDoesNotContain().length, 1);
      assert.strictEqual(lineFilters.lineDoesNotContain()[0], "foo");
    });

    it("should parse a lineDoesNotContain with double quote", () => {
      const lineFilters = new LineFilters("!= \"foo\"");

      assert.equal(lineFilters.lineDoesNotContain().length, 1);
      assert.strictEqual(lineFilters.lineDoesNotContain()[0], "foo");
    });

    it("should parse multiple lineDoesNotContain", () => {
      const lineFilters = new LineFilters("!= `foo` != `bar`");

      assert.equal(lineFilters.lineDoesNotContain().length, 2);
      assert.strictEqual(lineFilters.lineDoesNotContain()[0], "foo");
      assert.strictEqual(lineFilters.lineDoesNotContain()[1], "bar");
    });

    it("should parse a lineContainsRegexMatch", () => {
      const lineFilters = new LineFilters("|~ `foo`");

      assert.equal(lineFilters.lineContainsRegexMatch().length, 1);
      assert.strictEqual(lineFilters.lineContainsRegexMatch()[0], "foo");
    });

    it("should parse multiple lineContainsRegexMatch", () => {
      const lineFilters = new LineFilters("|~ `foo` |~ `bar`");

      assert.equal(lineFilters.lineContainsRegexMatch().length, 2);
      assert.strictEqual(lineFilters.lineContainsRegexMatch()[0], "foo");
      assert.strictEqual(lineFilters.lineContainsRegexMatch()[1], "bar");
    });

    it("should parse a lineDoesNotContainRegexMatch", () => {
      const lineFilters = new LineFilters("!~ `foo`");

      assert.equal(lineFilters.lineDoesNotContainRegexMatch().length, 1);
      assert.strictEqual(lineFilters.lineDoesNotContainRegexMatch()[0], "foo");
    });

    it("should parse multiple lineDoesNotContainRegexMatch", () => {
      const lineFilters = new LineFilters("!~ `foo` !~ `bar`");

      assert.equal(lineFilters.lineDoesNotContainRegexMatch().length, 2);
      assert.strictEqual(lineFilters.lineDoesNotContainRegexMatch()[0], "foo");
      assert.strictEqual(lineFilters.lineDoesNotContainRegexMatch()[1], "bar");
    });

    it("should parse each lineFilters", () => {
      const lineFilters = new LineFilters("|= `foo` != `bar` |~ `baz` !~ `qux`");

      assert.equal(lineFilters.lineContains().length, 1);
      assert.strictEqual(lineFilters.lineContains()[0], "foo");

      assert.equal(lineFilters.lineDoesNotContain().length, 1);
      assert.strictEqual(lineFilters.lineDoesNotContain()[0], "bar");

      assert.equal(lineFilters.lineContainsRegexMatch().length, 1);
      assert.strictEqual(lineFilters.lineContainsRegexMatch()[0], "baz");

      assert.equal(lineFilters.lineDoesNotContainRegexMatch().length, 1);
      assert.strictEqual(lineFilters.lineDoesNotContainRegexMatch()[0], "qux");
    });
  });

  describe("building", () => {
    it("should add a lineContains", () => {
      const lineFilters = new LineFilters();
      lineFilters.add("foo");

      assert.equal(lineFilters.lineContains().length, 1);
      assert.strictEqual(lineFilters.lineContains()[0], "foo");
    });

    it("should add a lineDoesNotContain", () => {
      const lineFilters = new LineFilters();
      lineFilters.add("foo", "lineDoesNotContain");

      assert.equal(lineFilters.lineDoesNotContain().length, 1);
      assert.strictEqual(lineFilters.lineDoesNotContain()[0], "foo");
    });

    it("should add a lineContainsRegexMatch", () => {
      const lineFilters = new LineFilters();
      lineFilters.add("foo", "lineContainsRegexMatch");

      assert.equal(lineFilters.lineContainsRegexMatch().length, 1);
      assert.strictEqual(lineFilters.lineContainsRegexMatch()[0], "foo");
    });

    it("should add a lineDoesNotContainRegexMatch", () => {
      const lineFilters = new LineFilters();
      lineFilters.add("foo", "lineDoesNotContainRegexMatch");

      assert.equal(lineFilters.lineDoesNotContainRegexMatch().length, 1);
      assert.strictEqual(lineFilters.lineDoesNotContainRegexMatch()[0], "foo");
    });

    it("should chain multiple lineFilters", () => {
      const lineFilters = new LineFilters();
      const result = lineFilters.add("foo")
        .add("bar", "lineDoesNotContain")
        .add("baz", "lineContainsRegexMatch")
        .add("qux", "lineDoesNotContainRegexMatch")
        .toString();

      assert.strictEqual(result, "|= `foo` != `bar` |~ `baz` !~ `qux`");
    });
  });
});
