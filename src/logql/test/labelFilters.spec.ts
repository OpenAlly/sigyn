// Import Node.js Dependencies
import assert from "node:assert";
import { describe, it } from "node:test";

// Import Internal Dependencies
import { LabelFilters } from "../src/labelFilters";

describe("LabelFilters", () => {
  describe("Constructor", () => {
    it("should handle a query", () => {
      const labels = new LabelFilters("app=\"foo\"");

      assert.strictEqual(labels.get("app")![0].value, "foo");
    });

    describe("Parsing", () => {
      it("should parse strict equal label", () => {
        const labels = new LabelFilters("app=\"foo\"");

        assert.strictEqual(labels.get("app")![0].value, "foo");
        assert.strictEqual(labels.get("app")![0].operator, "=");

        assert.equal(labels.size, 1);
      });

      it("should parse multiple strict equal labels", () => {
        const labels = new LabelFilters("app=\"foo\",env=\"dev\",job=\"bar\"");

        assert.strictEqual(labels.get("app")![0].value, "foo");
        assert.strictEqual(labels.get("app")![0].operator, "=");

        assert.strictEqual(labels.get("env")![0].value, "dev");
        assert.strictEqual(labels.get("env")![0].operator, "=");

        assert.strictEqual(labels.get("job")![0].value, "bar");
        assert.strictEqual(labels.get("job")![0].operator, "=");

        assert.equal(labels.size, 3);
      });

      it("should parse multiple strict equal labels with spaces", () => {
        const labels = new LabelFilters("app=\"foo\", env=\"dev\",   job=\"bar\"");

        assert.strictEqual(labels.get("app")![0].value, "foo");
        assert.strictEqual(labels.get("app")![0].operator, "=");

        assert.strictEqual(labels.get("env")![0].value, "dev");
        assert.strictEqual(labels.get("env")![0].operator, "=");

        assert.strictEqual(labels.get("job")![0].value, "bar");
        assert.strictEqual(labels.get("job")![0].operator, "=");

        assert.equal(labels.size, 3);
      });

      it("should parse strict double equal label", () => {
        const labels = new LabelFilters("app==\"foo\"");

        assert.strictEqual(labels.get("app")![0].value, "foo");
        assert.strictEqual(labels.get("app")![0].operator, "==");

        assert.equal(labels.size, 1);
      });

      it("should parse multiple strict double equal labels", () => {
        const labels = new LabelFilters("app==\"foo\",env==\"dev\",job==\"bar\"");

        assert.strictEqual(labels.get("app")![0].value, "foo");
        assert.strictEqual(labels.get("app")![0].operator, "==");

        assert.strictEqual(labels.get("env")![0].value, "dev");
        assert.strictEqual(labels.get("env")![0].operator, "==");

        assert.strictEqual(labels.get("job")![0].value, "bar");
        assert.strictEqual(labels.get("job")![0].operator, "==");

        assert.equal(labels.size, 3);
      });

      it("should parse multiple strict double equal labels with spaces", () => {
        const labels = new LabelFilters("app==\"foo\", env==\"dev\",   job==\"bar\"");

        assert.strictEqual(labels.get("app")![0].value, "foo");
        assert.strictEqual(labels.get("app")![0].operator, "==");

        assert.strictEqual(labels.get("env")![0].value, "dev");
        assert.strictEqual(labels.get("env")![0].operator, "==");

        assert.strictEqual(labels.get("job")![0].value, "bar");
        assert.strictEqual(labels.get("job")![0].operator, "==");

        assert.equal(labels.size, 3);
      });

      it("should parse not equal label", () => {
        const labels = new LabelFilters("app!=\"foo\"");

        assert.strictEqual(labels.get("app")![0].value, "foo");
        assert.strictEqual(labels.get("app")![0].operator, "!=");

        assert.equal(labels.size, 1);
      });

      it("should parse multiple not equal labels", () => {
        const labels = new LabelFilters("app!=\"foo\",env!=\"dev\",job!=\"bar\"");

        assert.strictEqual(labels.get("app")![0].value, "foo");
        assert.strictEqual(labels.get("app")![0].operator, "!=");

        assert.strictEqual(labels.get("env")![0].value, "dev");
        assert.strictEqual(labels.get("env")![0].operator, "!=");

        assert.strictEqual(labels.get("job")![0].value, "bar");
        assert.strictEqual(labels.get("job")![0].operator, "!=");

        assert.equal(labels.size, 3);
      });

      it("should parse multiple not equal labels with spaces", () => {
        const labels = new LabelFilters("app!=\"foo\", env!=\"dev\",   job!=\"bar\"");

        assert.strictEqual(labels.get("app")![0].value, "foo");
        assert.strictEqual(labels.get("app")![0].operator, "!=");

        assert.strictEqual(labels.get("env")![0].value, "dev");
        assert.strictEqual(labels.get("env")![0].operator, "!=");

        assert.strictEqual(labels.get("job")![0].value, "bar");
        assert.strictEqual(labels.get("job")![0].operator, "!=");

        assert.equal(labels.size, 3);
      });

      it("should parse regexMatches label", () => {
        const labels = new LabelFilters("app=~\"fo[oz]\"");

        assert.strictEqual(labels.get("app")![0].value, "fo[oz]");
        assert.strictEqual(labels.get("app")![0].operator, "=~");

        assert.equal(labels.size, 1);
      });

      it("should parse multiple regexMatches labels", () => {
        const labels = new LabelFilters("app=~\"fo[oz]\",job=~\"ba[rz]\"");

        assert.strictEqual(labels.get("app")![0].value, "fo[oz]");
        assert.strictEqual(labels.get("app")![0].operator, "=~");

        assert.strictEqual(labels.get("job")![0].value, "ba[rz]");
        assert.strictEqual(labels.get("job")![0].operator, "=~");

        assert.equal(labels.size, 2);
      });

      it("should parse multiple regexMatches labels with spaces", () => {
        const labels = new LabelFilters("app=~\"fo[oz]\", env=~\"(?:pre)?prod\",    job=~\"ba[rz]\"");

        assert.strictEqual(labels.get("app")![0].value, "fo[oz]");
        assert.strictEqual(labels.get("app")![0].operator, "=~");

        assert.strictEqual(labels.get("env")![0].value, "(?:pre)?prod");
        assert.strictEqual(labels.get("env")![0].operator, "=~");

        assert.strictEqual(labels.get("job")![0].value, "ba[rz]");
        assert.strictEqual(labels.get("job")![0].operator, "=~");

        assert.equal(labels.size, 3);
      });

      it("should parse regexDoesNotMatch label", () => {
        const labels = new LabelFilters("app!~\"fo[oz]\"");

        assert.strictEqual(labels.get("app")![0].value, "fo[oz]");
        assert.strictEqual(labels.get("app")![0].operator, "!~");

        assert.equal(labels.size, 1);
      });

      it("should parse multiple regexDoesNotMatch labels", () => {
        const labels = new LabelFilters("app!~\"fo[oz]\",job!~\"ba[rz]\"");

        assert.strictEqual(labels.get("app")![0].value, "fo[oz]");
        assert.strictEqual(labels.get("app")![0].operator, "!~");

        assert.strictEqual(labels.get("job")![0].value, "ba[rz]");
        assert.strictEqual(labels.get("job")![0].operator, "!~");

        assert.equal(labels.size, 2);
      });

      it("should parse multiple regexDoesNotMatch labels with spaces", () => {
        const labels = new LabelFilters("app!~\"fo[oz]\", env!~\"(?:pre)?prod\",    job!~\"ba[rz]\"");

        assert.strictEqual(labels.get("app")![0].value, "fo[oz]");
        assert.strictEqual(labels.get("app")![0].operator, "!~");

        assert.strictEqual(labels.get("env")![0].value, "(?:pre)?prod");
        assert.strictEqual(labels.get("env")![0].operator, "!~");

        assert.strictEqual(labels.get("job")![0].value, "ba[rz]");
        assert.strictEqual(labels.get("job")![0].operator, "!~");

        assert.equal(labels.size, 3);
      });

      it("should parse greaterThan label", () => {
        const labels = new LabelFilters("app>5");

        assert.strictEqual(labels.get("app")![0].value, 5);
        assert.strictEqual(labels.get("app")![0].operator, ">");

        assert.equal(labels.size, 1);
      });

      it("should parse multiple greaterThan labels", () => {
        const labels = new LabelFilters("app>5,job>6");

        assert.strictEqual(labels.get("app")![0].value, 5);
        assert.strictEqual(labels.get("app")![0].operator, ">");

        assert.strictEqual(labels.get("job")![0].value, 6);
        assert.strictEqual(labels.get("job")![0].operator, ">");

        assert.equal(labels.size, 2);
      });

      it("should parse multiple greaterThan labels with spaces", () => {
        const labels = new LabelFilters("app>5, env>6,    job>7");

        assert.strictEqual(labels.get("app")![0].value, 5);
        assert.strictEqual(labels.get("app")![0].operator, ">");

        assert.strictEqual(labels.get("env")![0].value, 6);
        assert.strictEqual(labels.get("env")![0].operator, ">");

        assert.strictEqual(labels.get("job")![0].value, 7);
        assert.strictEqual(labels.get("job")![0].operator, ">");

        assert.equal(labels.size, 3);
      });

      it("should parse greaterThanOrEqual label", () => {
        const labels = new LabelFilters("app>5");

        assert.strictEqual(labels.get("app")![0].value, 5);
        assert.strictEqual(labels.get("app")![0].operator, ">");

        assert.equal(labels.size, 1);
      });

      it("should parse multiple greaterThanOrEqual labels", () => {
        const labels = new LabelFilters("app>=5,job>=6");

        assert.strictEqual(labels.get("app")![0].value, 5);
        assert.strictEqual(labels.get("app")![0].operator, ">=");

        assert.strictEqual(labels.get("job")![0].value, 6);
        assert.strictEqual(labels.get("job")![0].operator, ">=");

        assert.equal(labels.size, 2);
      });

      it("should parse multiple greaterThanOrEqual labels with spaces", () => {
        const labels = new LabelFilters("app>=5, env>=6,    job>=7");

        assert.strictEqual(labels.get("app")![0].value, 5);
        assert.strictEqual(labels.get("app")![0].operator, ">=");

        assert.strictEqual(labels.get("env")![0].value, 6);
        assert.strictEqual(labels.get("env")![0].operator, ">=");

        assert.strictEqual(labels.get("job")![0].value, 7);
        assert.strictEqual(labels.get("job")![0].operator, ">=");

        assert.equal(labels.size, 3);
      });

      it("should parse lessThan label", () => {
        const labels = new LabelFilters("app<5");

        assert.strictEqual(labels.get("app")![0].value, 5);
        assert.strictEqual(labels.get("app")![0].operator, "<");

        assert.equal(labels.size, 1);
      });

      it("should parse multiple lessThan labels", () => {
        const labels = new LabelFilters("app<5,job<6");

        assert.strictEqual(labels.get("app")![0].value, 5);
        assert.strictEqual(labels.get("app")![0].operator, "<");

        assert.strictEqual(labels.get("job")![0].value, 6);
        assert.strictEqual(labels.get("job")![0].operator, "<");

        assert.equal(labels.size, 2);
      });

      it("should parse multiple lessThan labels with spaces", () => {
        const labels = new LabelFilters("app<5, env<6,    job<7");

        assert.strictEqual(labels.get("app")![0].value, 5);
        assert.strictEqual(labels.get("app")![0].operator, "<");

        assert.strictEqual(labels.get("env")![0].value, 6);
        assert.strictEqual(labels.get("env")![0].operator, "<");

        assert.strictEqual(labels.get("job")![0].value, 7);
        assert.strictEqual(labels.get("job")![0].operator, "<");

        assert.equal(labels.size, 3);
      });

      it("should parse lessThanOrEqual label", () => {
        const labels = new LabelFilters("app<=5");

        assert.strictEqual(labels.get("app")![0].value, 5);
        assert.strictEqual(labels.get("app")![0].operator, "<=");

        assert.equal(labels.size, 1);
      });

      it("should parse multiple lessThanOrEqual labels", () => {
        const labels = new LabelFilters("app<=5,job<=6");

        assert.strictEqual(labels.get("app")![0].value, 5);
        assert.strictEqual(labels.get("app")![0].operator, "<=");

        assert.strictEqual(labels.get("job")![0].value, 6);
        assert.strictEqual(labels.get("job")![0].operator, "<=");

        assert.equal(labels.size, 2);
      });

      it("should parse multiple lessThanOrEqual labels with spaces", () => {
        const labels = new LabelFilters("app<=5, env<=6,    job<=7");

        assert.strictEqual(labels.get("app")![0].value, 5);
        assert.strictEqual(labels.get("app")![0].operator, "<=");

        assert.strictEqual(labels.get("env")![0].value, 6);
        assert.strictEqual(labels.get("env")![0].operator, "<=");

        assert.strictEqual(labels.get("job")![0].value, 7);
        assert.strictEqual(labels.get("job")![0].operator, "<=");

        assert.equal(labels.size, 3);
      });

      it("should parse each label matching operator, string, number, duration unit, bytes unit", () => {
        const labels = new LabelFilters("| a = \"a\" b == 3 and size > 20kb or time <= 20ms, method=~`2..` | err !~ `Error*`");

        assert.strictEqual(labels.get("a")![0].value, "a");
        assert.strictEqual(labels.get("a")![0].operator, "=");

        assert.strictEqual(labels.get("b")![0].value, 3);
        assert.strictEqual(labels.get("b")![0].operator, "==");

        assert.strictEqual(labels.get("size")![0].value, "20kb");
        assert.strictEqual(labels.get("size")![0].operator, ">");

        assert.strictEqual(labels.get("time")![0].value, "20ms");
        assert.strictEqual(labels.get("time")![0].operator, "<=");

        assert.strictEqual(labels.get("method")![0].value, "2..");
        assert.strictEqual(labels.get("method")![0].operator, "=~");

        assert.strictEqual(labels.get("err")![0].value, "Error*");
        assert.strictEqual(labels.get("err")![0].operator, "!~");

        assert.equal(labels.size, 6);
      });

      it("should remove upfront stream selector", () => {
        const labels = new LabelFilters("{env=`production`} | size > 10");

        assert.strictEqual(labels.size, 1);

        const sizeLabels = labels.get("size")!;
        assert.strictEqual(sizeLabels.length, 1);
        assert.deepEqual(sizeLabels[0], { value: 10, operator: ">" });
      });
    });

    describe("Building", () => {
      it("should build an equal label by default", () => {
        const labels = new LabelFilters();
        labels.set("app", "foo");

        assert.equal(labels.get("app")![0].value, "foo");
        assert.equal(labels.get("app")![0].operator, "=");
      });

      it("should build an equal label given the operator", () => {
        const labels = new LabelFilters();
        labels.set("app", "foo", "=");

        assert.equal(labels.get("app")![0].value, "foo");
        assert.equal(labels.get("app")![0].operator, "=");
      });

      it("should build an equal label given an object without operator", () => {
        const labels = new LabelFilters();
        labels.set("app", { value: "foo" });

        assert.equal(labels.get("app")![0].value, "foo");
        assert.equal(labels.get("app")![0].operator, "=");
      });

      it("should build an equal label given an object with operator", () => {
        const labels = new LabelFilters();
        labels.set("app", { value: "foo", operator: "=" });

        assert.equal(labels.get("app")![0].value, "foo");
        assert.equal(labels.get("app")![0].operator, "=");
      });

      it("should build a double equal label", () => {
        const labels = new LabelFilters();
        labels.set("app", "foo", "==");

        assert.equal(labels.get("app")![0].value, "foo");
        assert.equal(labels.get("app")![0].operator, "==");
      });

      it("should build a double equal label given an object", () => {
        const labels = new LabelFilters();
        labels.set("app", { value: "foo", operator: "==" });

        assert.equal(labels.get("app")![0].value, "foo");
        assert.equal(labels.get("app")![0].operator, "==");
      });

      it("should build a not equal label", () => {
        const labels = new LabelFilters();
        labels.set("app", "foo", "!=");

        assert.equal(labels.get("app")![0].value, "foo");
        assert.equal(labels.get("app")![0].operator, "!=");
      });

      it("should build a not equal label given an object", () => {
        const labels = new LabelFilters();
        labels.set("app", { value: "foo", operator: "!=" });

        assert.equal(labels.get("app")![0].value, "foo");
        assert.equal(labels.get("app")![0].operator, "!=");
      });

      it("should build a regex match label", () => {
        const labels = new LabelFilters();
        labels.set("app", "foo", "=~");

        assert.equal(labels.get("app")![0].value, "foo");
        assert.equal(labels.get("app")![0].operator, "=~");
      });

      it("should build a regex match label given an object", () => {
        const labels = new LabelFilters();
        labels.set("app", { value: "foo", operator: "=~" });

        assert.equal(labels.get("app")![0].value, "foo");
        assert.equal(labels.get("app")![0].operator, "=~");
      });

      it("should build a regex not match label", () => {
        const labels = new LabelFilters();
        labels.set("app", "foo", "!~");

        assert.equal(labels.get("app")![0].value, "foo");
        assert.equal(labels.get("app")![0].operator, "!~");
      });

      it("should build a regex not match label given an object", () => {
        const labels = new LabelFilters();
        labels.set("app", { value: "foo", operator: "!~" });

        assert.equal(labels.get("app")![0].value, "foo");
        assert.equal(labels.get("app")![0].operator, "!~");
      });

      it("should build a less than label", () => {
        const labels = new LabelFilters();
        labels.set("app", 5, "<");

        assert.equal(labels.get("app")![0].value, 5);
        assert.equal(labels.get("app")![0].operator, "<");
      });

      it("should build a less than label given an object", () => {
        const labels = new LabelFilters();
        labels.set("app", { value: 5, operator: "<" });

        assert.equal(labels.get("app")![0].value, 5);
        assert.equal(labels.get("app")![0].operator, "<");
      });

      it("should build a less than or equal label", () => {
        const labels = new LabelFilters();
        labels.set("app", 5, "<=");

        assert.equal(labels.get("app")![0].value, 5);
        assert.equal(labels.get("app")![0].operator, "<=");
      });

      it("should build a less than or equal label given an object", () => {
        const labels = new LabelFilters();
        labels.set("app", { value: 5, operator: "<=" });

        assert.equal(labels.get("app")![0].value, 5);
        assert.equal(labels.get("app")![0].operator, "<=");
      });

      it("should build a greater than label", () => {
        const labels = new LabelFilters();
        labels.set("app", 5, ">");

        assert.equal(labels.get("app")![0].value, 5);
        assert.equal(labels.get("app")![0].operator, ">");
      });

      it("should build a greater than label given an object", () => {
        const labels = new LabelFilters();
        labels.set("app", { value: 5, operator: ">" });

        assert.equal(labels.get("app")![0].value, 5);
        assert.equal(labels.get("app")![0].operator, ">");
      });

      it("should build a greater than or equal label", () => {
        const labels = new LabelFilters();
        labels.set("app", 5, ">=");

        assert.equal(labels.get("app")![0].value, 5);
        assert.equal(labels.get("app")![0].operator, ">=");
      });

      it("should build a greater than or equal label given an object", () => {
        const labels = new LabelFilters();
        labels.set("app", { value: 5, operator: ">=" });

        assert.equal(labels.get("app")![0].value, 5);
        assert.equal(labels.get("app")![0].operator, ">=");
      });
    });

    describe("Serialize", () => {
      it("should serialize a complexe query", () => {
        const labels = new LabelFilters();
        labels.set("app", "foo", "=");
        labels.set("env", "prod", "==");
        labels.set("version", "1.0", "!=");
        labels.set("foo", "bar", "=~");
        labels.set("fox", "baz", "!~");
        labels.set("size", "20kb", ">=");
        labels.set("counter", 5, "<");

        assert.equal(
          labels.toString(),
          "| app = \"foo\" | env == \"prod\" | version != \"1.0\" | foo =~ `bar` | fox !~ `baz` | size >= \"20kb\" | counter < 5"
        );
      });

      it("should be an empty string if no labels are set", () => {
        const labels = new LabelFilters();

        assert.equal(labels.toString(), "");
      });
    });

    describe("toJSON()", () => {
      it("should return an empty object", () => {
        const labels = new LabelFilters();

        assert.deepEqual(labels.toJSON(), {});
      });

      it("should return label filters with operators", () => {
        const labels = new LabelFilters();
        labels.set("app", "foo", "=");
        labels.set("app", "foz", "=");
        labels.set("env", "prod", "==");
        labels.set("version", "1.0", "!=");
        labels.set("foo", "bar", "=~");
        labels.set("fox", "baz", "!~");
        labels.set("size", "20kb", ">=");
        labels.set("counter", 5, "<");

        assert.deepEqual(labels.toJSON(), {
          app: [{ value: "foo", operator: "=" }, { value: "foz", operator: "=" }],
          env: [{ value: "prod", operator: "==" }],
          version: [{ value: "1.0", operator: "!=" }],
          foo: [{ value: "bar", operator: "=~" }],
          fox: [{ value: "baz", operator: "!~" }],
          size: [{ value: "20kb", operator: ">=" }],
          counter: [{ value: 5, operator: "<" }]
        });
      });
    });

    describe("kv()", () => {
      it("should return an empty object", () => {
        const labels = new LabelFilters();

        assert.deepEqual(labels.kv(), {});
      });

      it("should return label filters without operators", () => {
        const labels = new LabelFilters();
        labels.set("app", "foo", "=");
        labels.set("env", "prod", "==");
        labels.set("env", "dev", "==");

        assert.deepEqual(labels.kv(), {
          app: ["foo"],
          env: ["prod", "dev"]
        });
      });
    });
  });
});
