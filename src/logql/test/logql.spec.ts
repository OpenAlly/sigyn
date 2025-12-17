// Import Node.js Dependencies
import assert from "node:assert";
import { describe, it } from "node:test";

// Import Internal Dependencies
import { LogQL } from "../src/index.ts";
import { StreamSelector } from "../src/streamSelector.ts";
import { LineFilters } from "../src/lineFilters.ts";

describe("LogQL", () => {
  describe("static type", () => {
    it("should return 'metric' given a metric query", () => {
      assert.strictEqual(
        LogQL.type("count_over_time({ label = `value` } [5m])"),
        "metric"
      );
    });

    it("should return 'query' given a normal query with no aggregations etc", () => {
      assert.strictEqual(
        LogQL.type("{ label = `value` }"),
        "query"
      );
    });
  });

  describe("constructor", () => {
    it("should create a new instance of LogQL", () => {
      const logql = new LogQL();

      assert.ok(logql instanceof LogQL);
      assert.strictEqual(logql.type, "query");
    });

    it("should be a lineContains given a string", () => {
      const logql = new LogQL("my super logql");

      assert.equal(logql.lineFilters.lineContains().length, 1);
      assert.strictEqual(logql.lineFilters.lineContains()[0], "my super logql");
    });

    it("should be a list of lineContains given a list of string", () => {
      const logql = new LogQL(["foo", "bar"]);

      assert.equal(logql.lineFilters.lineContains().length, 2);
      assert.strictEqual(logql.lineFilters.lineContains()[0], "foo");
      assert.strictEqual(logql.lineFilters.lineContains()[1], "bar");
    });

    it("should instanciate given a StreamSelector", () => {
      const logql = new LogQL(new StreamSelector(["{app=\"foo\"}", "{env=\"dev\"}"]));

      assert.equal(logql.streamSelector.get("app")!.value, "foo");
      assert.equal(logql.streamSelector.get("env")!.value, "dev");
    });

    it("should instanciate given a LineFilters", () => {
      const logql = new LogQL(new LineFilters("|= `foo` |= `bar`"));

      assert.equal(logql.lineFilters.lineContains()[0], "foo");
      assert.equal(logql.lineFilters.lineContains()[1], "bar");
    });
  });

  it("should parse stream selector", () => {
    const logql = new LogQL("{app=\"foo\", env=\"preprod\"}");

    assert.equal(logql.streamSelector.size, 2);
    assert.strictEqual(logql.streamSelector.get("app")!.value, "foo");
    assert.strictEqual(logql.streamSelector.get("env")!.value, "preprod");
  });

  it("should parse labels and lineContains", () => {
    const logql = new LogQL("{app=\"foo\", env=\"preprod\"} |= `my super logql`");

    assert.equal(logql.streamSelector.size, 2);
    assert.strictEqual(logql.streamSelector.get("app")!.value, "foo");
    assert.strictEqual(logql.streamSelector.get("env")!.value, "preprod");

    assert.equal(logql.lineFilters.lineContains().length, 1);
    assert.strictEqual(logql.lineFilters.lineContains()[0], "my super logql");
    assert.strictEqual(
      logql.toString(),
      "{app=\"foo\",env=\"preprod\"} |= `my super logql`"
    );
  });

  it("should build and serialize a LogQL query", () => {
    const logql = new LogQL();

    logql.streamSelector.set("app", "foo").set("env", "preprod");

    logql.lineFilters.add("foo")
      .add("bar", "lineDoesNotContain")
      .add("baz", "lineContainsRegexMatch")
      .add("qux", "lineDoesNotContainRegexMatch");

    logql.labelFilters.set("foo", "bar");
    logql.labelFilters.set("size", 5, ">");

    logql.parserExpression.toJson({ foo: "bar" });
    logql.parserExpression.toUnpack();

    assert.strictEqual(
      logql.toString(),
      "{app=\"foo\",env=\"preprod\"} |= `foo` != `bar` |~ `baz` !~ `qux` | foo = \"bar\" | size > 5 | json foo=\"bar\" | unpack"
    );
  });

  it("should parse a LogQL with lineFilter, labelFilter and parseExpression", () => {
    const logql = new LogQL(
      // eslint-disable-next-line @stylistic/max-len
      "{app=\"discussion\",env=\"production\"} |= \"returned \"GET /rooms/availableUsers\" | regexp `((?P<execTime>[0-9.]+)ms)` | execTime > 500"
    );

    assert.ok(logql.streamSelector.size === 2);
    assert.ok(logql.lineFilters.size === 1);
    assert.ok(logql.labelFilters.size === 1);
    assert.ok(logql.parserExpression.regexp?.length === 1);

    assert.strictEqual(
      logql.toString(),
      "{app=\"discussion\",env=\"production\"} |= `returned ` | regexp `((?P<execTime>[0-9.]+)ms)` | execTime > 500"
    );
  });

  it("should preserve metric without modifications", () => {
    const originalQL = "count_over_time({job=\"mysql\"}[5m])";
    const logql = new LogQL(originalQL);

    assert.strictEqual(logql.type, "metric");
    assert.strictEqual(logql.toString(), originalQL);
  });
});
