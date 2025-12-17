// Import Node.js Dependencies
import assert from "node:assert";
import { describe, it } from "node:test";

// Import Internal Dependencies
import { ParserExpression } from "../src/parserExpression.ts";

describe("ParserExpression", () => {
  describe("Parsing", () => {
    describe("Json", () => {
      it("should parse json with no params", () => {
        const parserExpression = new ParserExpression("| json");

        assert.deepEqual(parserExpression.json, {});
      });

      it("should parse json with no params succeded with other parser expression", () => {
        const parserExpression = new ParserExpression("| json | foo | bar");

        assert.deepEqual(parserExpression.json, {});
      });

      it("should parse json with no params preceded with other parser expression", () => {
        const parserExpression = new ParserExpression("| foo | bar | json");

        assert.deepEqual(parserExpression.json, {});
      });

      it("should parse json without param in a complete LogQL query", () => {
        const parserExpression = new ParserExpression("{app=\"sigyn\"} |= `Starting` | json | foo = `bar`");

        assert.deepEqual(parserExpression.json, {});
      });

      it("should parse json with params", () => {
        const parserExpression = new ParserExpression("| json server=\"servers[0]\", ua=\"request.headers[\"User-Agent\"]\"");

        assert.deepEqual(parserExpression.json, { server: "servers[0]", ua: "request.headers[\"User-Agent\"]" });
      });

      it("should parse json with default value params", () => {
        const parserExpression = new ParserExpression("| json server, ua=\"request.headers[\"User-Agent\"]\"");

        assert.deepEqual(parserExpression.json, { server: "server", ua: "request.headers[\"User-Agent\"]" });
      });

      it("should parse json with params in a complete LogQL query", () => {
        const parserExpression = new ParserExpression("{app=\"sigyn\"} |= `Starting` | json s=\"s\" | foo = `bar`");

        assert.deepEqual(parserExpression.json, { s: "s" });
      });

      it("should not parse json", () => {
        const parserExpression = new ParserExpression("{app=\"sigyn\"} |= `Starting` | notjson | foo = `bar`");

        assert.equal(parserExpression.json, null);
      });
    });

    describe("Logfmt", () => {
      it("should parse logfmt with no params", () => {
        const parserExpression = new ParserExpression("| logfmt");

        assert.deepEqual(parserExpression.logfmt, {});
      });

      it("should parse logfmt with no params succeded with other parser expression", () => {
        const parserExpression = new ParserExpression("| logfmt | foo | bar");

        assert.deepEqual(parserExpression.logfmt, {});
      });

      it("should parse logfmt with no params preceded with other parser expression", () => {
        const parserExpression = new ParserExpression("| foo | bar | logfmt");

        assert.deepEqual(parserExpression.logfmt, {});
      });

      it("should parse logfmt without param in a complete LogQL query", () => {
        const parserExpression = new ParserExpression("{app=\"sigyn\"} |= `Starting` | logfmt | foo = `bar`");

        assert.deepEqual(parserExpression.logfmt, {});
      });

      it("should parse logfmt with params", () => {
        const parserExpression = new ParserExpression("| logfmt server=\"servers[0]\", ua=\"request.headers[\"User-Agent\"]\"");

        assert.deepEqual(parserExpression.logfmt, { server: "servers[0]", ua: "request.headers[\"User-Agent\"]" });
      });

      it("should parse logfmt with default value params", () => {
        const parserExpression = new ParserExpression("| logfmt server, ua=\"request.headers[\"User-Agent\"]\"");

        assert.deepEqual(parserExpression.logfmt, { server: "server", ua: "request.headers[\"User-Agent\"]" });
      });

      it("should parse logfmt with params in a complete LogQL query", () => {
        const parserExpression = new ParserExpression("{app=\"sigyn\"} |= `Starting` | logfmt s=\"s\" | foo = `bar`");

        assert.deepEqual(parserExpression.logfmt, { s: "s" });
      });

      it("should not parse logfmt", () => {
        const parserExpression = new ParserExpression("{app=\"sigyn\"} |= `Starting` | notlogfmt | foo = `bar`");

        assert.equal(parserExpression.logfmt, null);
      });
    });

    describe("Pattern", () => {
      it("should parse pattern with no other parser expression", () => {
        const parserExpression = new ParserExpression("| pattern `<ip>`");

        assert.deepEqual(
          parserExpression.pattern,
          ["<ip>"]
        );
      });

      it("should parse multiple pattern with no other parser expression", () => {
        const parserExpression = new ParserExpression("| pattern `<ip>` | pattern `<xd>`");

        assert.deepEqual(
          parserExpression.pattern,
          ["<ip>", "<xd>"]
        );
      });

      it("should parse multiple pattern with other parser expression", () => {
        const parserExpression = new ParserExpression("| json | pattern `<ip>` | pattern `<xd>` | foo | bar");

        assert.deepEqual(
          parserExpression.pattern,
          ["<ip>", "<xd>"]
        );
      });

      it("should parse pattern succeded with other parser expression", () => {
        const parserExpression = new ParserExpression("| pattern `<ip>` | foo | bar");

        assert.deepEqual(
          parserExpression.pattern,
          ["<ip>"]
        );
      });

      it("should parse pattern preceded with other parser expression", () => {
        const parserExpression = new ParserExpression("| foo | bar | pattern `<ip>`");

        assert.deepEqual(
          parserExpression.pattern,
          ["<ip>"]
        );
      });

      it("should parse pattern in a complete LogQL query", () => {
        const parserExpression = new ParserExpression("{app=\"sigyn\"} |= `Starting` | pattern `<ip>` | foo = `bar`");

        assert.deepEqual(
          parserExpression.pattern,
          ["<ip>"]
        );
      });

      it("should not parse pattern", () => {
        const parserExpression = new ParserExpression("{app=\"sigyn\"} |= `Starting` | notpattern `<ip>` | foo = `bar`");

        assert.equal(parserExpression.pattern, null);
      });
    });

    describe("RegExp", () => {
      it("should parse regexp with no other parser expression", () => {
        const parserExpression = new ParserExpression("| regexp \"(?P<name>re)\"");

        assert.deepEqual(
          parserExpression.regexp,
          ["(?P<name>re)"]
        );
      });

      it("should parse multiple regexp with no other parser expression", () => {
        const parserExpression = new ParserExpression("| regexp \"(?P<name>re)\" | regexp \"(?P<name>ea)\"");

        assert.deepEqual(
          parserExpression.regexp,
          ["(?P<name>re)", "(?P<name>ea)"]
        );
      });

      it("should parse multiple regexp with other parser expression", () => {
        const parserExpression = new ParserExpression("| json | regexp \"(?P<name>re)\" | regexp \"(?P<name>ea)\" | foo | bar");

        assert.deepEqual(
          parserExpression.regexp,
          ["(?P<name>re)", "(?P<name>ea)"]
        );
      });

      it("should parse pattern regexp with other parser expression", () => {
        const parserExpression = new ParserExpression("| regexp \"(?P<name>re)\" | foo | bar");

        assert.deepEqual(
          parserExpression.regexp,
          ["(?P<name>re)"]
        );
      });

      it("should parse regexp preceded with other parser expression", () => {
        const parserExpression = new ParserExpression("| foo | bar | regexp \"(?P<name>re)\"");

        assert.deepEqual(
          parserExpression.regexp,
          ["(?P<name>re)"]
        );
      });

      it("should parse regexp in a complete LogQL query", () => {
        const parserExpression = new ParserExpression("{app=\"sigyn\"} |= `Starting` | regexp \"(?P<name>re)\" | foo = `bar`");

        assert.deepEqual(
          parserExpression.regexp,
          ["(?P<name>re)"]
        );
      });

      it("should not parse regexp", () => {
        const parserExpression = new ParserExpression("{app=\"sigyn\"} |= `Starting` | notregexp \"(?P<name>re)\" | foo = `bar`");

        assert.equal(parserExpression.regexp, null);
      });
    });

    describe("Unpack", () => {
      it("should parse unpack with no other parser expression", () => {
        const parserExpression = new ParserExpression("| unpack");

        assert.equal(parserExpression.unpack, true);
      });

      it("should parse unpack with other parser expression", () => {
        const parserExpression = new ParserExpression("| json | unpack | foo | bar");

        assert.equal(parserExpression.unpack, true);
      });

      it("should not parse unpack", () => {
        const parserExpression = new ParserExpression("| notunpack | foo | bar");

        assert.equal(parserExpression.unpack, false);
      });
    });
  });

  describe("Building", () => {
    describe("Json", () => {
      it("should add json with no params", () => {
        const parserExpression = new ParserExpression();

        assert.equal(parserExpression.json, null);

        parserExpression.toJson();

        assert.deepEqual(parserExpression.json, {});
      });

      it("should add json with params", () => {
        const parserExpression = new ParserExpression();

        assert.equal(parserExpression.json, null);

        parserExpression.toJson({ foo: "bar" });

        assert.deepEqual(parserExpression.json, { foo: "bar" });
      });

      it("should add json with default value (string)", () => {
        const parserExpression = new ParserExpression();

        assert.equal(parserExpression.json, null);

        parserExpression.toJson("foo");

        assert.deepEqual(parserExpression.json, { foo: "foo" });
      });
    });

    describe("Logfmt", () => {
      it("should add logfmt with no params", () => {
        const parserExpression = new ParserExpression();

        assert.equal(parserExpression.logfmt, null);

        parserExpression.toLogfmt();

        assert.deepEqual(parserExpression.logfmt, {});
      });

      it("should add logfmt with params", () => {
        const parserExpression = new ParserExpression();

        assert.equal(parserExpression.logfmt, null);

        parserExpression.toLogfmt({ foo: "bar" });

        assert.deepEqual(parserExpression.logfmt, { foo: "bar" });
      });

      it("should add logfmt with default value (string)", () => {
        const parserExpression = new ParserExpression();

        assert.equal(parserExpression.json, null);

        parserExpression.toLogfmt("foo");

        assert.deepEqual(parserExpression.logfmt, { foo: "foo" });
      });
    });

    describe("Pattern", () => {
      it("should add pattern", () => {
        const parserExpression = new ParserExpression();

        assert.equal(parserExpression.pattern, null);

        parserExpression.toPattern("<ip>");

        assert.deepEqual(parserExpression.pattern, ["<ip>"]);
      });

      it("should add multiple pattern", () => {
        const parserExpression = new ParserExpression();

        assert.equal(parserExpression.pattern, null);

        parserExpression.toPattern(["<ip>", "<pi>"]);

        assert.deepEqual(parserExpression.pattern, ["<ip>", "<pi>"]);
      });
    });

    describe("RegExp", () => {
      it("should add regexp", () => {
        const parserExpression = new ParserExpression();

        assert.equal(parserExpression.regexp, null);

        parserExpression.toRegexp("(?P<name>re)");

        assert.deepEqual(parserExpression.regexp, ["(?P<name>re)"]);
      });

      it("should add multiple regexp", () => {
        const parserExpression = new ParserExpression();

        assert.equal(parserExpression.regexp, null);

        parserExpression.toRegexp(["(?P<name>re)", "(?P<name>ree)"]);

        assert.deepEqual(parserExpression.regexp, ["(?P<name>re)", "(?P<name>ree)"]);
      });
    });
  });

  describe("Unpack", () => {
    it("should add unpack", () => {
      const parserExpression = new ParserExpression();

      assert.equal(parserExpression.unpack, false);

      parserExpression.toUnpack();

      assert.deepEqual(parserExpression.unpack, true);
    });
  });

  describe("Serialize", () => {
    it("should serialize empty string", () => {
      const parserExpression = new ParserExpression();

      assert.deepEqual(parserExpression.lowStringEnd(), "");
      assert.deepEqual(parserExpression.highStringEnd(), "");
    });

    describe("Json", () => {
      it("should serialize json with no params", () => {
        const parserExpression = new ParserExpression();

        parserExpression.toJson();

        assert.strictEqual(parserExpression.lowStringEnd(), "");
        assert.strictEqual(parserExpression.highStringEnd(), "| json");
      });

      it("should serialize json with params", () => {
        const parserExpression = new ParserExpression();

        parserExpression.toJson({ foo: "bar" });

        assert.strictEqual(parserExpression.lowStringEnd(), "");
        assert.strictEqual(parserExpression.highStringEnd(), "| json foo=\"bar\"");
      });
    });

    describe("Logfmt", () => {
      it("should serialize logfmt with no params", () => {
        const parserExpression = new ParserExpression();

        parserExpression.toLogfmt();

        assert.strictEqual(parserExpression.lowStringEnd(), "");
        assert.strictEqual(parserExpression.highStringEnd(), "| logfmt");
      });

      it("should serialize logfmt with params", () => {
        const parserExpression = new ParserExpression();

        parserExpression.toLogfmt({ foo: "bar" });

        assert.strictEqual(parserExpression.lowStringEnd(), "");
        assert.strictEqual(parserExpression.highStringEnd(), "| logfmt foo=\"bar\"");
      });
    });

    describe("Pattern", () => {
      it("should serialize a single pattern ", () => {
        const parserExpression = new ParserExpression();

        parserExpression.toPattern("<ip>");

        assert.strictEqual(parserExpression.lowStringEnd(), "| pattern `<ip>`");
        assert.strictEqual(parserExpression.highStringEnd(), "");
      });

      it("should serialize multiple patterns", () => {
        const parserExpression = new ParserExpression();

        parserExpression.toPattern(["<ip>", "<pi>"]);

        assert.strictEqual(parserExpression.lowStringEnd(), "| pattern `<ip>` | pattern `<pi>`");
        assert.strictEqual(parserExpression.highStringEnd(), "");
      });
    });

    describe("RegExp", () => {
      it("should serialize a single regexp ", () => {
        const parserExpression = new ParserExpression();

        parserExpression.toRegexp("(?P<name>re)");

        assert.strictEqual(parserExpression.lowStringEnd(), "| regexp `(?P<name>re)`");
        assert.strictEqual(parserExpression.highStringEnd(), "");
      });

      it("should serialize multiple regexp", () => {
        const parserExpression = new ParserExpression();

        parserExpression.toRegexp(["(?P<name>re)", "(?P<name>ree)"]);

        assert.strictEqual(parserExpression.lowStringEnd(), "| regexp `(?P<name>re)` | regexp `(?P<name>ree)`");
        assert.strictEqual(parserExpression.highStringEnd(), "");
      });
    });

    describe("Unpack", () => {
      it("should serialize unpack", () => {
        const parserExpression = new ParserExpression();

        parserExpression.toUnpack();

        assert.strictEqual(parserExpression.lowStringEnd(), "");
        assert.strictEqual(parserExpression.highStringEnd(), "| unpack");
      });
    });

    describe("All", () => {
      it("should serialize all", () => {
        const parserExpression = new ParserExpression();

        parserExpression.toJson({ foo: "bar" })
          .toLogfmt({ foo: "bar" })
          .toPattern("<ip>")
          .toRegexp("(?P<name>re)")
          .toUnpack();

        assert.strictEqual(parserExpression.lowStringEnd(), "| pattern `<ip>` | regexp `(?P<name>re)`");
        assert.strictEqual(parserExpression.highStringEnd(), "| json foo=\"bar\" | logfmt foo=\"bar\" | unpack");
      });
    });
  });
});
