// Import Node.js Dependencies
import assert from "node:assert";
import { describe, it } from "node:test";

// Import Third-party Dependencies
import esmock from "esmock";

// Import Internal Dependencies
import { morphix, type MorphixFunction } from "../dist/index.mjs";

describe("Morphix", () => {
  it("main", async() => {
    // Normal placeholder
    assert.equal(await morphix("{foo}", { foo: "!" }), "!");
    assert.equal(await morphix("{foo}", { foo: 10 }), "10");
    assert.equal(await morphix("{foo}", { foo: 0 }), "0");
    assert.equal(await morphix("{fo-o}", { "fo-o": 0 }), "0");
    assert.equal(await morphix("{foo}{foo}", { foo: "!" }), "!!");
    assert.equal(await morphix("{foo}{bar}{foo}", { foo: "!", bar: "#" }), "!#!");
    assert.equal(await morphix("yo {foo} lol {bar} sup", { foo: "🦄", bar: "🌈" }), "yo 🦄 lol 🌈 sup");

    assert.equal(await morphix("{foo}{deeply.nested.valueFoo}", {
      foo: "!",
      deeply: {
        nested: {
          valueFoo: "#"
        }
      }
    }), "!#");

    assert.equal(await morphix("{0}{1}", ["!", "#"]), "!#");

    assert.equal(await morphix("{0}{1}", ["!", "#"]), "!#");
  });

  it("do not match non-identifiers", async() => {
    const fixture = "\"*.{json,md,css,graphql,html}\"";
    assert.equal(await morphix(fixture, []), fixture);
  });

  it("ignore missing", async() => {
    const template = "foo{{bar}}{undefined}";
    const options = { ignoreMissing: true };
    assert.equal(await morphix(template, {}, options), template);
  });

  it("throw on undefined by default", async() => {
    assert.rejects(async() => {
      await morphix("{foo}", {});
    }, {
      message: "Missing a value for the placeholder: foo"
    });
  });

  it("transform and ignore missing", async() => {
    const options = {
      ignoreMissing: true,
      transform: ({ value }) => (Number.isNaN(Number.parseInt(value, 10)) ? undefined : value)
    };
    assert.equal(await morphix("{0} {1} {2}", ["0", 42, 3.14], options), "0 42 3.14");
    assert.equal(await morphix("{0} {1} {2}", ["0", null, 3.14], options), "0 {1} 3.14");
  });

  it("transform and throw on undefined", async() => {
    const options = {
      transform: ({ value }) => (Number.isNaN(Number.parseInt(value, 10)) ? undefined : value)
    };

    await assert.doesNotReject(async() => {
      await morphix("{0} {1} {2}", ["0", 42, 3.14], options);
    });

    await assert.rejects(async() => {
      await morphix("{0} {1} {2}", ["0", null, 3.14], options);
    }, {
      message: "Missing a value for the placeholder: 1"
    });
  });

  it("should capitalize value", async() => {
    assert.equal(await morphix("{foo | capitalize}", { foo: "foo" }), "Foo");
  });

  it("should find ip hostname", async() => {
    const { morphix } = await esmock("../dist/index.mjs", {
      "node:dns/promises": {
        reverse: async() => ["dns.google"]
      }
    });
    assert.equal(await morphix("host: {foo | dnsresolve}", { foo: "8.8.8.8" }), "host: dns.google");
  });

  it("should not find ip hostname", async() => {
    const { morphix } = await esmock("../dist/index.mjs", {
      "node:dns/promises": {
        reverse: async() => {
          throw new Error("Not found");
        }
      }
    });
    assert.equal(await morphix("host: {foo | dnsresolve}", { foo: "8.8.8.8" }), "host: 8.8.8.8");
  });

  describe("customFunctions", () => {
    it("should use a new custom 'replace' function", async() => {
      const customFunctions: Record<string, MorphixFunction> = {
        replace: (value) => value.replaceAll("o", "i")
      };

      const computedStr = await morphix(
        "{ foo | replace }",
        { foo: "foo" },
        { customFunctions }
      );
      assert.strictEqual(
        computedStr,
        "fii"
      );
    });
  });
});
