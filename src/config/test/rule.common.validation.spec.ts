/* eslint-disable max-len */
// Import Node.js Dependencies
import assert from "node:assert";
import { describe, it } from "node:test";

// Import Internal Dependencies
import { validateConfig } from "../src/validate";
import { VALID_CONFIG } from "./helpers";

describe("Rule common validations", () => {
  it("rule name should be required", () => {
    assert.throws(() => {
      validateConfig({
        ...VALID_CONFIG,
        rules: [
          {
            ...VALID_CONFIG.rules[0],
            name: undefined as any
          }
        ]
      });
    }, {
      name: "Error",
      message: "Invalid config: /rules/0: must have required property 'name'"
    });
  });

  it("rule name should not be empty", () => {
    assert.throws(() => {
      validateConfig({
        ...VALID_CONFIG,
        rules: [
          {
            ...VALID_CONFIG.rules[0],
            name: ""
          }
        ]
      });
    }, {
      name: "Error",
      message: "Invalid config: /rules/0/name: must NOT have fewer than 1 characters"
    });
  });

  it("rule name should be unique", () => {
    assert.throws(() => {
      validateConfig({
        ...VALID_CONFIG,
        rules: [
          {
            ...VALID_CONFIG.rules[0]
          },
          {
            ...VALID_CONFIG.rules[0]
          }
        ]
      });
    }, {
      name: "Error",
      // TODO: should we have a better error message?
      message: "Invalid config: /rules: must pass \"uniqueItemProperties\" keyword validation"
    });
  });

  it("rule logql should be required", () => {
    assert.throws(() => {
      validateConfig({
        ...VALID_CONFIG,
        rules: [
          {
            ...VALID_CONFIG.rules[0],
            logql: undefined as any
          }
        ]
      });
    }, {
      name: "Error",
      message: "Invalid config: /rules/0: must have required property 'logql'"
    });
  });

  it("rule logql must be defined", () => {
    assert.throws(() => {
      validateConfig({
        ...VALID_CONFIG,
        rules: [
          {
            ...VALID_CONFIG.rules[0],
            logql: ""
          }
        ]
      });
    }, {
      name: "Error",
      message: "Invalid config: /rules/0/logql: must NOT have fewer than 1 characters, /rules/0/logql: must be object, /rules/0/logql: must match exactly one schema in oneOf"
    });
  });

  it("rule logql can be string", () => {
    assert.doesNotThrow(() => {
      validateConfig({
        ...VALID_CONFIG,
        rules: [
          {
            ...VALID_CONFIG.rules[0],
            logql: "{ app=\"foo\" } |= \"bar\""
          }
        ]
      });
    });
  });

  it("rule logql can be an object", () => {
    assert.doesNotThrow(() => {
      validateConfig({
        ...VALID_CONFIG,
        rules: [
          {
            ...VALID_CONFIG.rules[0],
            logql: {
              query: "{ app=\"foo\" } |= \"bar\""
            }
          }
        ]
      });
    });
  });

  it("rule logql can have variables", () => {
    assert.doesNotThrow(() => {
      validateConfig({
        ...VALID_CONFIG,
        rules: [
          {
            ...VALID_CONFIG.rules[0],
            logql: {
              query: "{ app=\"foo\" } |= \"bar\"",
              vars: {
                foo: ["bar"],
                baz: ["foo", "bar"]
              }
            }
          }
        ]
      });
    });
  });

  it("rule logql variables cannot be empty object", () => {
    assert.throws(() => {
      validateConfig({
        ...VALID_CONFIG,
        rules: [
          {
            ...VALID_CONFIG.rules[0],
            logql: {
              query: "{ app=\"foo\" } |= \"bar\"",
              vars: {}
            }
          }
        ]
      });
    }, {
      name: "Error",
      message: "Invalid config: /rules/0/logql: must be string, /rules/0/logql/vars: must NOT have fewer than 1 properties, /rules/0/logql: must match exactly one schema in oneOf"
    });
  });

  it("rule logql variables must be string or string[]", () => {
    assert.throws(() => {
      validateConfig({
        ...VALID_CONFIG,
        rules: [
          {
            ...VALID_CONFIG.rules[0],
            logql: {
              query: "{ app=\"foo\" } |= \"bar\"",
              vars: {
                foo: "bar",
                baz: 55
              },
              foo: "bar"
            } as any
          }
        ]
      });
    }, {
      name: "Error",
      message: "Invalid config: /rules/0/logql: must be string, /rules/0/logql: must NOT have additional properties, /rules/0/logql: must match exactly one schema in oneOf"
    });
  });
  it("rule logql cannot have additional properties", () => {
    assert.throws(() => {
      validateConfig({
        ...VALID_CONFIG,
        rules: [
          {
            ...VALID_CONFIG.rules[0],
            logql: {
              query: "{ app=\"foo\" } |= \"bar\"",
              vars: {
                foo: "bar",
                baz: ["foo", "bar"]
              },
              foo: "bar"
            } as any
          }
        ]
      });
    }, {
      name: "Error",
      message: "Invalid config: /rules/0/logql: must be string, /rules/0/logql: must NOT have additional properties, /rules/0/logql: must match exactly one schema in oneOf"
    });
  });

  it("rule polling should be optional", () => {
    assert.doesNotThrow(() => {
      validateConfig({
        ...VALID_CONFIG,
        rules: [
          {
            ...VALID_CONFIG.rules[0],
            polling: undefined
          }
        ]
      });
    });
  });

  const durationPollings = [
    "20milliseconds", "20 milliseconds",
    "20msecs", "20 msecs",
    "20ms", "20 ms",
    "20seconds", "20 seconds",
    "20secs", "20 secs",
    "20s", "20 s",
    "20minutes", "20 minutes",
    "20mins", "20 mins",
    "20m", "20 m",
    "20hours", "20 hours",
    "20hrs", "20 hrs",
    "20h", "20 h"
  ];
  for (const polling of durationPollings) {
    it(`rule polling can be a duration (${polling})`, () => {
      assert.doesNotThrow(() => {
        validateConfig({
          ...VALID_CONFIG,
          rules: [
            {
              ...VALID_CONFIG.rules[0],
              polling
            }
          ]
        });
      });
    });
  }

  const cronPollings = [
    "*/5 * * * * *", "*/5 * * * *", "* 7-20 * * *", "* 7-20 * * 1-5"
  ];
  for (const polling of cronPollings) {
    it(`rule polling can be a cron expression (${polling})`, () => {
      assert.doesNotThrow(() => {
        validateConfig({
          ...VALID_CONFIG,
          rules: [
            {
              ...VALID_CONFIG.rules[0],
              polling
            }
          ]
        });
      });
    });
  }

  it("rule polling can be an array of cron expressions", () => {
    assert.doesNotThrow(() => {
      validateConfig({
        ...VALID_CONFIG,
        rules: [
          {
            ...VALID_CONFIG.rules[0],
            polling: cronPollings
          }
        ]
      });
    });
  });

  it("rule polling should not be empty string", () => {
    assert.throws(() => {
      validateConfig({
        ...VALID_CONFIG,
        rules: [
          {
            ...VALID_CONFIG.rules[0],
            polling: ""
          }
        ]
      });
    }, {
      name: "Error",
      message: "Invalid config: /rules/0/polling: must match pattern \"^((?:\\d+)?\\.?\\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$\", /rules/0/polling: must match pattern \"(((\\d+,)+\\d+|(\\d+(\\/|-)\\d+)|\\d+|\\*) ?){5,6}\", /rules/0/polling: must match exactly one schema in oneOf, /rules/0/polling: must be array, /rules/0/polling: must match a schema in anyOf"
    });
  });

  it("rule polling should not be empty array", () => {
    assert.throws(() => {
      validateConfig({
        ...VALID_CONFIG,
        rules: [
          {
            ...VALID_CONFIG.rules[0],
            polling: []
          }
        ]
      });
    }, {
      name: "Error",
      message: "Invalid config: /rules/0/polling: must match exactly one schema in oneOf, /rules/0/polling: must NOT have fewer than 1 items, /rules/0/polling: must match a schema in anyOf"
    });
  });

  it("rule polling should not be empty string in array", () => {
    assert.throws(() => {
      validateConfig({
        ...VALID_CONFIG,
        rules: [
          {
            ...VALID_CONFIG.rules[0],
            polling: ["* * * * *", ""]
          }
        ]
      });
    }, {
      name: "Error",
      message: "Invalid config: /rules/0/polling: must match exactly one schema in oneOf, /rules/0/polling/1: must match pattern \"(((\\d+,)+\\d+|(\\d+(\\/|-)\\d+)|\\d+|\\*) ?){5,6}\", /rules/0/polling: must match a schema in anyOf"
    });
  });

  it("array of rule polling must be cron expression", () => {
    assert.throws(() => {
      validateConfig({
        ...VALID_CONFIG,
        rules: [
          {
            ...VALID_CONFIG.rules[0],
            polling: ["1m"]
          }
        ]
      });
    }, {
      name: "Error",
      message: "Invalid config: /rules/0/polling: must match exactly one schema in oneOf, /rules/0/polling/0: must match pattern \"(((\\d+,)+\\d+|(\\d+(\\/|-)\\d+)|\\d+|\\*) ?){5,6}\", /rules/0/polling: must match a schema in anyOf"
    });
  });

  it("rule polling can be string array", () => {
    assert.doesNotThrow(() => {
      validateConfig({
        ...VALID_CONFIG,
        rules: [
          {
            ...VALID_CONFIG.rules[0],
            polling: ["* * * * *"]
          }
        ]
      });
    });
  });

  it("rule pollingStrategy should be optional", () => {
    assert.doesNotThrow(() => {
      validateConfig({
        ...VALID_CONFIG,
        rules: [
          {
            ...VALID_CONFIG.rules[0],
            pollingStrategy: undefined
          }
        ]
      });
    });
  });

  it("rule pollingStrategy can be 'unbounded'", () => {
    assert.doesNotThrow(() => {
      validateConfig({
        ...VALID_CONFIG,
        rules: [
          {
            ...VALID_CONFIG.rules[0],
            pollingStrategy: "unbounded"
          }
        ]
      });
    });
  });

  it("rule pollingStrategy can be 'bounded'", () => {
    assert.doesNotThrow(() => {
      validateConfig({
        ...VALID_CONFIG,
        rules: [
          {
            ...VALID_CONFIG.rules[0],
            pollingStrategy: "bounded"
          }
        ]
      });
    });
  });

  it("rule pollingStrategy cannot be anything else", () => {
    assert.throws(() => {
      validateConfig({
        ...VALID_CONFIG,
        rules: [
          {
            ...VALID_CONFIG.rules[0],
            pollingStrategy: "all" as any
          }
        ]
      });
    }, {
      name: "Error",
      message: "Invalid config: /rules/0/pollingStrategy: must be equal to one of the allowed values"
    });
  });

  it("rule property 'labelFilters' must be an object", () => {
    assert.throws(() => {
      validateConfig({
        ...VALID_CONFIG,
        rules: [
          {
            ...VALID_CONFIG.rules[0],
            labelFilters: true as any

          }
        ]
      });
    }, {
      name: "Error",
      message: "Invalid config: /rules/0/labelFilters: must be object"
    });
  });

  it("rule property 'labelFilters' cannot be an empty object", () => {
    assert.throws(() => {
      validateConfig({
        ...VALID_CONFIG,
        rules: [
          {
            ...VALID_CONFIG.rules[0],
            labelFilters: {}
          }
        ]
      });
    }, {
      name: "Error",
      message: "Invalid config: /rules/0/labelFilters: must NOT have fewer than 1 properties"
    });
  });

  it("rule property 'labelFilters' properties must be an array", () => {
    assert.throws(() => {
      validateConfig({
        ...VALID_CONFIG,
        rules: [
          {
            ...VALID_CONFIG.rules[0],
            labelFilters: {
              foo: {} as any
            }
          }
        ]
      });
    }, {
      name: "Error",
      message: "Invalid config: /rules/0/labelFilters/foo: must be array"
    });
  });

  it("rule property 'labelFilters' properties cannot be an empty array", () => {
    assert.throws(() => {
      validateConfig({
        ...VALID_CONFIG,
        rules: [
          {
            ...VALID_CONFIG.rules[0],
            labelFilters: {
              foo: []
            }
          }
        ]
      });
    }, {
      name: "Error",
      message: "Invalid config: /rules/0/labelFilters/foo: must NOT have fewer than 1 items"
    });
  });

  it("rule property 'labelFilters' properties items must be string", () => {
    assert.throws(() => {
      validateConfig({
        ...VALID_CONFIG,
        rules: [
          {
            ...VALID_CONFIG.rules[0],
            labelFilters: {
              foo: ["bar", 15 as any]
            }
          }
        ]
      });
    }, {
      name: "Error",
      message: "Invalid config: /rules/0/labelFilters/foo/1: must be string"
    });
  });
});
