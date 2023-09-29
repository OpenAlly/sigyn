/* eslint-disable max-lines */
/* eslint-disable max-len */
// Import Node.js Dependencies
import assert from "node:assert";
import { describe, it } from "node:test";

// Import Internal Dependencies
import { validateConfig } from "../src/validate";
import { AlertSeverity, PartialSigynConfig } from "../src/types";

// CONSTANTS
const kValidConfig: PartialSigynConfig = {
  loki: {
    apiUrl: "http://localhost:3100"
  },
  notifiers: {
    foo: {
      bar: "baz"
    }
  },
  rules: [
    {
      name: "test1",
      logql: "{app=\"foo\", env=\"prod\"} |= `One of the file names does not match what is expected`",
      polling: "1m",
      alert: {
        on: {
          count: 6,
          interval: "5m"
        },
        template: {
          title: "🚨 {ruleName} - Triggered {counter} times!",
          content: [
            "- LogQL: {logql}",
            "- Threshold: {count}",
            "- Interval: {interval}"
          ]
        }
      },
      labelFilters: {
        env: ["prod", "preprod"]
      }
    }
  ]
};
const kValidAlertSeverities: AlertSeverity[] = [
  "critical",
  "error", "major",
  "warning", "minor",
  "information", "info", "low"
];

describe("Config validation", () => {
  it("should validate a valid config", () => {
    assert.doesNotThrow(() => {
      validateConfig(kValidConfig);
    });
  });

  it("given a config without loki", () => {
    assert.throws(() => {
      validateConfig({
        ...kValidConfig,
        loki: undefined as any
      });
    }, {
      name: "Error",
      message: "Invalid config: : must have required property 'loki'"
    });
  });

  it("given a config without loki apiUrl, it should throws", () => {
    assert.throws(() => {
      validateConfig({
        ...kValidConfig,
        loki: {} as any
      });
    }, {
      name: "Error",
      message: "Invalid config: /loki: must have required property 'apiUrl'"
    });
  });

  it("loki apiUrl must be string", () => {
    assert.throws(() => {
      validateConfig({
        ...kValidConfig,
        loki: {
          apiUrl: 42 as any
        }
      });
    }, {
      name: "Error",
      message: "Invalid config: /loki/apiUrl: must be string"
    });
  });

  it("given a rule template with only title, it should validate", () => {
    assert.doesNotThrow(() => {
      validateConfig({
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0],
            alert: {
              ...kValidConfig.rules[0].alert,
              template: {
                title: "foo"
              }
            }
          }
        ]
      });
    });
  });

  it("given a root template with only title, it should validate", () => {
    assert.doesNotThrow(() => {
      validateConfig({
        ...kValidConfig,
        templates: {
          foo: {
            title: "foo"
          }
        }
      });
    });
  });

  it("given a rule template with only content, it should validate", () => {
    assert.doesNotThrow(() => {
      validateConfig({
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0],
            alert: {
              ...kValidConfig.rules[0].alert,
              template: {
                content: ["foo"]
              }
            }
          }
        ]
      });
    });
  });

  it("given an extended template with title only, it should validate", () => {
    assert.doesNotThrow(() => {
      validateConfig({
        ...kValidConfig,
        templates: {
          foo: {
            content: ["foo"]
          },
          bar: {
            extends: "foo",
            title: "bar"
          }
        }
      });
    });
  });

  it("given an extended template with content only, it should validate", () => {
    assert.doesNotThrow(() => {
      validateConfig({
        ...kValidConfig,
        templates: {
          foo: {
            content: ["foo"]
          },
          bar: {
            extends: "foo",
            content: ["bar"]
          }
        }
      });
    });
  });

  it("given an extended template with title & content, it should validate", () => {
    assert.doesNotThrow(() => {
      validateConfig({
        ...kValidConfig,
        templates: {
          foo: {
            content: ["foo"]
          },
          bar: {
            extends: "foo",
            content: ["bar"]
          }
        }
      });
    });
  });

  it("given an extended template with content 'before', it should validate", () => {
    assert.doesNotThrow(() => {
      validateConfig({
        ...kValidConfig,
        templates: {
          foo: {
            content: ["foo"]
          },
          bar: {
            extends: "foo",
            content: {
              before: ["bar"]
            }
          }
        }
      });
    });
  });

  it("given an extended template with content 'after', it should validate", () => {
    assert.doesNotThrow(() => {
      validateConfig({
        ...kValidConfig,
        templates: {
          foo: {
            content: ["foo"]
          },
          bar: {
            extends: "foo",
            content: {
              after: ["bar"]
            }
          }
        }
      });
    });
  });

  it("given an extended template with content 'before' and 'after', it should validate", () => {
    assert.doesNotThrow(() => {
      validateConfig({
        ...kValidConfig,
        templates: {
          foo: {
            content: ["foo"]
          },
          bar: {
            extends: "foo",
            content: {
              before: ["bar"],
              after: ["baz"]
            }
          }
        }
      });
    });
  });

  it("given a non-extended template with content 'before', it should throws", () => {
    assert.throws(() => {
      validateConfig({
        ...kValidConfig,
        templates: {
          foo: {
            content: ["foo"]
          },
          bar: {
            content: {
              before: ["bar"],
              after: ["baz"]
            }
          }
        }
      });
    }, {
      name: "Error",
      message: "Invalid config: /templates/bar/content: must be array"
    });
  });

  it("given an extended template (root) which does not exists, it should throws", () => {
    assert.throws(() => {
      validateConfig({
        ...kValidConfig,
        templates: {
          foo: {
            content: ["foo"]
          },
          bar: {
            extends: "baz",
            content: {
              before: ["bar"],
              after: ["baz"]
            }
          }
        }
      });
    }, {
      name: "Error",
      message: "Template 'baz' not found"
    });
  });

  it("given an extended template (rule) which does not exists, it should throws", () => {
    assert.throws(() => {
      validateConfig({
        ...kValidConfig,
        templates: {
          foo: {
            content: ["foo"]
          }
        },
        rules: [
          {
            ...kValidConfig.rules[0],
            alert: {
              ...kValidConfig.rules[0].alert,
              template: {
                extends: "unknown",
                content: ["foo"]
              }
            }
          }
        ]
      });
    }, {
      name: "Error",
      message: "Template 'unknown' not found"
    });
  });

  it("given a root template with only content, it should validate", () => {
    assert.doesNotThrow(() => {
      validateConfig({
        ...kValidConfig,
        templates: {
          foo: {
            content: ["foo"]
          }
        }
      });
    });
  });

  it("given a rule template with empty title, it should throws", () => {
    assert.throws(() => {
      validateConfig({
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0],
            alert: {
              ...kValidConfig.rules[0].alert,
              template: {
                title: ""
              }
            }
          }
        ]
      });
    }, {
      name: "Error",
      message: "Invalid config: /rules/0/alert/template/title: must NOT have fewer than 1 characters, /rules/0/alert/template: must be string, /rules/0/alert/template: must match exactly one schema in oneOf"
    });
  });

  it("given a rule non-extended template with empty content, it should throws", () => {
    assert.throws(() => {
      validateConfig({
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0],
            alert: {
              ...kValidConfig.rules[0].alert,
              template: {
                content: []
              }
            }
          }
        ]
      });
    }, {
      name: "Error",
      message: "Invalid config: /rules/0/alert/template/content: must NOT have fewer than 1 items, /rules/0/alert/template: must match \"else\" schema, /rules/0/alert/template: must be string, /rules/0/alert/template: must match exactly one schema in oneOf"
    });
  });

  it("given a rule template with empty title and valid content, it should throws", () => {
    assert.throws(() => {
      validateConfig({
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0],
            alert: {
              ...kValidConfig.rules[0].alert,
              template: {
                title: "",
                content: ["foo"]
              }
            }
          }
        ]
      });
    }, {
      name: "Error",
      message: "Invalid config: /rules/0/alert/template/title: must NOT have fewer than 1 characters, /rules/0/alert/template: must be string, /rules/0/alert/template: must match exactly one schema in oneOf"
    });
  });

  it("given a root template with empty title and valid content, it should throws", () => {
    assert.throws(() => {
      validateConfig({
        ...kValidConfig,
        templates: {
          foo: {
            title: "",
            content: ["foo"]
          }
        }
      });
    }, {
      name: "Error",
      message: "Invalid config: /templates/foo/title: must NOT have fewer than 1 characters"
    });
  });

  it("given a rule non-extended template with empty content and valid title, it should throws", () => {
    assert.throws(() => {
      validateConfig({
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0],
            alert: {
              ...kValidConfig.rules[0].alert,
              template: {
                title: "test",
                content: []
              }
            }
          }
        ]
      });
    }, {
      name: "Error",
      message: "Invalid config: /rules/0/alert/template/content: must NOT have fewer than 1 items, /rules/0/alert/template: must match \"else\" schema, /rules/0/alert/template: must be string, /rules/0/alert/template: must match exactly one schema in oneOf"
    });
  });

  it("given a root template with empty content and valid title, it should throws", () => {
    assert.throws(() => {
      validateConfig({
        ...kValidConfig,
        templates: {
          foo: {
            title: "test",
            content: []
          }
        }
      });
    }, {
      name: "Error",
      message: "Invalid config: /templates/foo/content: must NOT have fewer than 1 items"
    });
  });

  it("given a rule template without title and content, it should throws", () => {
    assert.throws(() => {
      validateConfig({
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0],
            alert: {
              ...kValidConfig.rules[0].alert,
              template: {}
            }
          }
        ]
      });
    }, {
      name: "Error",
      message: "Invalid config: /rules/0/alert/template: must have required property 'title', /rules/0/alert/template: must have required property 'content', /rules/0/alert/template: must have required property 'extends', /rules/0/alert/template: must match a schema in anyOf, /rules/0/alert/template: must be string, /rules/0/alert/template: must match exactly one schema in oneOf"
    });
  });

  it("given a root template without title and content, it should throws", () => {
    assert.throws(() => {
      validateConfig({
        ...kValidConfig,
        templates: {
          foo: {}
        }
      });
    }, {
      name: "Error",
      message: "Invalid config: /templates/foo: must have required property 'title', /templates/foo: must have required property 'content', /templates/foo: must have required property 'extends', /templates/foo: must match a schema in anyOf"
    });
  });

  it("given root rule template, it should validate", () => {
    assert.doesNotThrow(() => {
      validateConfig({
        ...kValidConfig,
        templates: {
          foo: {
            content: ["foo"]
          }
        },
        rules: [
          {
            ...kValidConfig.rules[0],
            alert: {
              ...kValidConfig.rules[0].alert,
              template: "foo"
            }
          }
        ]
      });
    });
  });

  it("given an unknown root rule template, it should throws", () => {
    assert.throws(() => {
      validateConfig({
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0],
            alert: {
              ...kValidConfig.rules[0].alert,
              template: "foo"
            }
          }
        ]
      });
    }, {
      name: "Error",
      message: "Template 'foo' not found"
    });
  });

  it("rule name should be required", () => {
    assert.throws(() => {
      validateConfig({
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0],
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
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0],
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
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0]
          },
          {
            ...kValidConfig.rules[0]
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
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0],
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
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0],
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
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0],
            logql: "{ app=\"foo\" } |= \"bar\""
          }
        ]
      });
    });
  });

  it("rule logql can be an object", () => {
    assert.doesNotThrow(() => {
      validateConfig({
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0],
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
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0],
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
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0],
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
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0],
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
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0],
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
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0],
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
          ...kValidConfig,
          rules: [
            {
              ...kValidConfig.rules[0],
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
          ...kValidConfig,
          rules: [
            {
              ...kValidConfig.rules[0],
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
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0],
            polling: cronPollings
          }
        ]
      });
    });
  });

  it("rule polling should not be empty string", () => {
    assert.throws(() => {
      validateConfig({
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0],
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
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0],
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
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0],
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
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0],
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
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0],
            polling: ["* * * * *"]
          }
        ]
      });
    });
  });

  it("rule pollingStrategy should be optional", () => {
    assert.doesNotThrow(() => {
      validateConfig({
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0],
            pollingStrategy: undefined
          }
        ]
      });
    });
  });

  it("rule pollingStrategy can be 'unbounded'", () => {
    assert.doesNotThrow(() => {
      validateConfig({
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0],
            pollingStrategy: "unbounded"
          }
        ]
      });
    });
  });

  it("rule pollingStrategy can be 'bounded'", () => {
    assert.doesNotThrow(() => {
      validateConfig({
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0],
            pollingStrategy: "bounded"
          }
        ]
      });
    });
  });

  it("rule pollingStrategy cannot be anything else", () => {
    assert.throws(() => {
      validateConfig({
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0],
            pollingStrategy: "all" as any
          }
        ]
      });
    }, {
      name: "Error",
      message: "Invalid config: /rules/0/pollingStrategy: must be equal to one of the allowed values"
    });
  });

  it("rule alert should be required", () => {
    assert.throws(() => {
      validateConfig({
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0],
            alert: undefined as any
          }
        ]
      });
    }, {
      name: "Error",
      message: "Invalid config: /rules/0: must have required property 'alert'"
    });
  });

  it("rule alert property 'on' should be required", () => {
    assert.throws(() => {
      validateConfig({
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0],
            alert: {
              ...kValidConfig.rules[0].alert,
              on: undefined as any
            }
          }
        ]
      });
    }, {
      name: "Error",
      message: "Invalid config: /rules/0/alert: must have required property 'on'"
    });
  });

  it("rule alert property 'on.count' should be required", () => {
    assert.throws(() => {
      validateConfig({
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0],
            alert: {
              ...kValidConfig.rules[0].alert,
              on: {
                ...kValidConfig.rules[0].alert.on,
                count: undefined as any
              }
            }
          }
        ]
      });
    }, {
      name: "Error",
      message: "Invalid config: /rules/0/alert/on: must have required property 'count'"
    });
  });

  it("rule alert property 'on.count' should be string or integer", () => {
    assert.throws(() => {
      validateConfig({
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0],
            alert: {
              ...kValidConfig.rules[0].alert,
              on: {
                ...kValidConfig.rules[0].alert.on,
                count: true as any
              }
            }
          }
        ]
      });
    }, {
      name: "Error",
      message: "Invalid config: /rules/0/alert/on/count: must be integer, /rules/0/alert/on/count: must be string, /rules/0/alert/on/count: must match exactly one schema in oneOf"
    });
  });

  it("rule alert property 'on.count' cannot be float", () => {
    assert.throws(() => {
      validateConfig({
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0],
            alert: {
              ...kValidConfig.rules[0].alert,
              on: {
                ...kValidConfig.rules[0].alert.on,
                count: 50.5
              }
            }
          }
        ]
      });
    }, {
      name: "Error",
      message: "Invalid config: /rules/0/alert/on/count: must be integer, /rules/0/alert/on/count: must be string, /rules/0/alert/on/count: must match exactly one schema in oneOf"
    });
  });

  it("rule alert property 'on.value' OR `on.valueMatch` should be required when rule is label based", () => {
    assert.throws(() => {
      validateConfig({
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0],
            alert: {
              ...kValidConfig.rules[0].alert,
              on: {
                ...kValidConfig.rules[0].alert.on,
                count: undefined,
                label: "foo",
                percentThreshold: 80
              }
            }
          }
        ]
      });
    }, {
      name: "Error",
      message: "Invalid config: /rules/0/alert/on: must have required property 'value', /rules/0/alert/on: must have required property 'valueMatch', /rules/0/alert/on: must match exactly one schema in oneOf"
    });
  });

  it("rule alert property 'on.count' should be required when rule is label count based", () => {
    assert.throws(() => {
      validateConfig({
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0],
            alert: {
              ...kValidConfig.rules[0].alert,
              on: {
                ...kValidConfig.rules[0].alert.on,
                count: undefined,
                label: "foo",
                value: "bar"
              }
            }
          }
        ]
      });
    }, {
      name: "Error",
      message: "Invalid config: /rules/0/alert/on: must have property count when property label is present"
    });
  });

  it("rule alert property 'on.percentThreshold' cannot be float", () => {
    assert.throws(() => {
      validateConfig({
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0],
            alert: {
              ...kValidConfig.rules[0].alert,
              on: {
                ...kValidConfig.rules[0].alert.on,
                count: undefined,
                label: "foo",
                value: "bar",
                percentThreshold: 80.5
              }
            }
          }
        ]
      });
    }, {
      name: "Error",
      message: "Invalid config: /rules/0/alert/on/percentThreshold: must be integer"
    });
  });

  it("rule alert can be label based (value)", () => {
    assert.doesNotThrow(() => {
      validateConfig({
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0],
            alert: {
              ...kValidConfig.rules[0].alert,
              on: {
                ...kValidConfig.rules[0].alert.on,
                count: undefined,
                label: "foo",
                value: "bar",
                percentThreshold: 80
              }
            }
          }
        ]
      });
    });
  });

  it("rule alert can be label based (valueMatch)", () => {
    assert.doesNotThrow(() => {
      validateConfig({
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0],
            alert: {
              ...kValidConfig.rules[0].alert,
              on: {
                ...kValidConfig.rules[0].alert.on,
                count: undefined,
                label: "foo",
                valueMatch: "bar",
                percentThreshold: 80
              }
            }
          }
        ]
      });
    });
  });

  it("rule label alert cannot be based on both percentThreshold and count", () => {
    assert.throws(() => {
      validateConfig({
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0],
            alert: {
              ...kValidConfig.rules[0].alert,
              on: {
                ...kValidConfig.rules[0].alert.on,
                count: 10,
                label: "foo",
                value: "bar",
                percentThreshold: 80
              }
            }
          }
        ]
      });
    }, {
      name: "Error",
      // TODO: the message should be more explicit
      message: "Invalid config: /rules/0/alert/on: must NOT be valid"
    });
  });

  it("rule alert property 'on.interval' should be required when rule is no label based", () => {
    assert.throws(() => {
      validateConfig({
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0],
            alert: {
              ...kValidConfig.rules[0].alert,
              on: {
                ...kValidConfig.rules[0].alert.on,
                interval: undefined as any
              }
            }
          }
        ]
      });
    }, {
      name: "Error",
      message: "Invalid config: /rules/0/alert/on: must have required property 'interval'"
    });
  });

  it("rule alert property 'on.interval' or 'on.minimumLabelCount' should be required when rule is label percent threhsold based (value)", () => {
    assert.throws(() => {
      validateConfig({
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0],
            alert: {
              ...kValidConfig.rules[0].alert,
              on: {
                ...kValidConfig.rules[0].alert.on,
                count: undefined,
                interval: undefined,
                minimumLabelCount: undefined,
                label: "foo",
                value: "bar",
                percentThreshold: 80
              }
            }
          }
        ]
      });
    }, {
      name: "Error",
      message: "Invalid config: /rules/0/alert/on: must have required property 'minimumLabelCount', /rules/0/alert/on: must have required property 'interval', /rules/0/alert/on: must match a schema in anyOf, /rules/0/alert/on: must have required property 'minimumLabelCount', /rules/0/alert/on: must have required property 'interval', /rules/0/alert/on: must match a schema in anyOf, /rules/0/alert/on: must match exactly one schema in oneOf"
    });
  });

  it("rule alert property 'on.interval' or 'on.minimumLabelCount' should be required when rule is label percent threhsold based (valueMatch)", () => {
    assert.throws(() => {
      validateConfig({
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0],
            alert: {
              ...kValidConfig.rules[0].alert,
              on: {
                ...kValidConfig.rules[0].alert.on,
                count: undefined,
                interval: undefined,
                minimumLabelCount: undefined,
                label: "foo",
                valueMatch: "bar",
                percentThreshold: 80
              }
            }
          }
        ]
      });
    }, {
      name: "Error",
      message: "Invalid config: /rules/0/alert/on: must have required property 'minimumLabelCount', /rules/0/alert/on: must have required property 'interval', /rules/0/alert/on: must match a schema in anyOf, /rules/0/alert/on: must have required property 'minimumLabelCount', /rules/0/alert/on: must have required property 'interval', /rules/0/alert/on: must match a schema in anyOf, /rules/0/alert/on: must match exactly one schema in oneOf"
    });
  });

  it("rule label percent threshold based can have minimumLabelCount skiped when interval is set (value)", () => {
    assert.doesNotThrow(() => {
      validateConfig({
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0],
            alert: {
              ...kValidConfig.rules[0].alert,
              on: {
                ...kValidConfig.rules[0].alert.on,
                count: undefined,
                interval: "5m",
                minimumLabelCount: undefined,
                label: "foo",
                value: "bar",
                percentThreshold: 80
              }
            }
          }
        ]
      });
    });
  });

  it("rule label percent threshold based can have minimumLabelCount skiped when interval is set (valueMatch)", () => {
    assert.doesNotThrow(() => {
      validateConfig({
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0],
            alert: {
              ...kValidConfig.rules[0].alert,
              on: {
                ...kValidConfig.rules[0].alert.on,
                count: undefined,
                interval: "5m",
                minimumLabelCount: undefined,
                label: "foo",
                valueMatch: "bar",
                percentThreshold: 80
              }
            }
          }
        ]
      });
    });
  });

  it("rule label percent threshold based can have interval skiped when minimumLabelCount is set (value)", () => {
    assert.doesNotThrow(() => {
      validateConfig({
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0],
            alert: {
              ...kValidConfig.rules[0].alert,
              on: {
                ...kValidConfig.rules[0].alert.on,
                count: undefined,
                interval: undefined,
                minimumLabelCount: 50,
                label: "foo",
                value: "bar",
                percentThreshold: 80
              }
            }
          }
        ]
      });
    });
  });

  it("rule label percent threshold based can have interval skiped when minimumLabelCount is set (valueMatch)", () => {
    assert.doesNotThrow(() => {
      validateConfig({
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0],
            alert: {
              ...kValidConfig.rules[0].alert,
              on: {
                ...kValidConfig.rules[0].alert.on,
                count: undefined,
                interval: undefined,
                minimumLabelCount: 50,
                label: "foo",
                value: "bar",
                percentThreshold: 80
              }
            }
          }
        ]
      });
    });
  });

  it("rule count label does not need an interval or a minimumLabelCount (value)", () => {
    assert.doesNotThrow(() => {
      validateConfig({
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0],
            alert: {
              ...kValidConfig.rules[0].alert,
              on: {
                ...kValidConfig.rules[0].alert.on,
                count: 50,
                interval: undefined,
                minimumLabelCount: undefined,
                label: "foo",
                value: "bar"
              }
            }
          }
        ]
      });
    });
  });

  it("rule count label does not need an interval or a minimumLabelCount (valueMatch)", () => {
    assert.doesNotThrow(() => {
      validateConfig({
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0],
            alert: {
              ...kValidConfig.rules[0].alert,
              on: {
                ...kValidConfig.rules[0].alert.on,
                count: 50,
                interval: undefined,
                minimumLabelCount: undefined,
                label: "foo",
                value: "bar"
              }
            }
          }
        ]
      });
    });
  });

  it("rule label based cannot have both value and valueMatch", () => {
    assert.throws(() => {
      validateConfig({
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0],
            alert: {
              ...kValidConfig.rules[0].alert,
              on: {
                ...kValidConfig.rules[0].alert.on,
                count: 50,
                label: "foo",
                value: "bar",
                valueMatch: "baz"
              }
            }
          }
        ]
      });
    }, {
      name: "Error",
      // TODO: should we have a better error message?
      message: "Invalid config: /rules/0/alert/on: must match exactly one schema in oneOf"
    });
  });

  it("rule alert property 'on.interval' should be a string", () => {
    assert.throws(() => {
      validateConfig({
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0],
            alert: {
              ...kValidConfig.rules[0].alert,
              on: {
                ...kValidConfig.rules[0].alert.on,
                interval: 15 as any
              }
            }
          }
        ]
      });
    }, {
      name: "Error",
      message: "Invalid config: /rules/0/alert/on/interval: must be string"
    });
  });

  for (const severity of kValidAlertSeverities) {
    it(`rule alert property 'on.severity' can be ${severity}`, () => {
      assert.doesNotThrow(() => {
        validateConfig({
          ...kValidConfig,
          rules: [
            {
              ...kValidConfig.rules[0],
              alert: {
                ...kValidConfig.rules[0].alert,
                severity
              }
            }
          ]
        });
      });
    });
  }

  it("rule alert property 'on.severity' cannot be another value", () => {
    assert.throws(() => {
      validateConfig({
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0],
            alert: {
              ...kValidConfig.rules[0].alert,
              severity: "foo" as any
            }
          }
        ]
      });
    }, {
      name: "Error",
      message: "Invalid config: /rules/0/alert/severity: must be equal to one of the allowed values"
    });
  });

  it("rule alert property 'throttle' can be set", () => {
    assert.doesNotThrow(() => {
      validateConfig({
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0],
            alert: {
              ...kValidConfig.rules[0].alert,
              throttle: {
                interval: "1m",
                count: 5
              }
            }
          }
        ]
      });
    });
  });

  it("rule alert property 'throttle' must be an object", () => {
    assert.throws(() => {
      validateConfig({
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0],
            alert: {
              ...kValidConfig.rules[0].alert,
              throttle: "hello" as any
            }
          }
        ]
      });
    }, {
      name: "Error",
      message: "Invalid config: /rules/0/alert/throttle: must be object"
    });
  });

  it("rule alert property 'throttle.count' should be optional", () => {
    assert.doesNotThrow(() => {
      validateConfig({
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0],
            alert: {
              ...kValidConfig.rules[0].alert,
              throttle: {
                interval: "1m"
              }
            }
          }
        ]
      });
    });
  });

  it("rule alert property 'throttle.count' cannot be float", () => {
    assert.throws(() => {
      validateConfig({
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0],
            alert: {
              ...kValidConfig.rules[0].alert,
              throttle: {
                interval: "1m",
                count: 5.5
              }
            }
          }
        ]
      });
    }, {
      name: "Error",
      message: "Invalid config: /rules/0/alert/throttle/count: must be integer"
    });
  });

  it("rule alert property 'throttle.interval' should be required", () => {
    assert.throws(() => {
      validateConfig({
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0],
            alert: {
              ...kValidConfig.rules[0].alert,
              throttle: {
                interval: undefined as any
              }
            }
          }
        ]
      });
    }, {
      name: "Error",
      message: "Invalid config: /rules/0/alert/throttle: must have required property 'interval'"
    });
  });

  it("rule alert property 'throttle.interval' must be a duration", () => {
    assert.throws(() => {
      validateConfig({
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0],
            alert: {
              ...kValidConfig.rules[0].alert,
              throttle: {
                interval: 5 as any
              }
            }
          }
        ]
      });
    }, {
      name: "Error",
      message: "Invalid config: /rules/0/alert/throttle/interval: must be string"
    });
  });

  it("rule alert property 'throttle.count' must be an integer", () => {
    assert.throws(() => {
      validateConfig({
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0],
            alert: {
              ...kValidConfig.rules[0].alert,
              throttle: {
                interval: "1m",
                count: "5" as any
              }
            }
          }
        ]
      });
    }, {
      name: "Error",
      message: "Invalid config: /rules/0/alert/throttle/count: must be integer"
    });
  });

  it("rule property 'labelFilters' must be an object", () => {
    assert.throws(() => {
      validateConfig({
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0],
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
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0],
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
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0],
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
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0],
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
        ...kValidConfig,
        rules: [
          {
            ...kValidConfig.rules[0],
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

  it("property 'missingLabelStrategy' should be optional", () => {
    assert.doesNotThrow(() => {
      validateConfig({
        ...kValidConfig,
        missingLabelStrategy: undefined
      });
    });
  });

  it("property 'missingLabelStrategy' can be 'ignore'", () => {
    assert.doesNotThrow(() => {
      validateConfig({
        ...kValidConfig,
        missingLabelStrategy: "ignore"
      });
    });
  });

  it("property 'missingLabelStrategy' can be 'error'", () => {
    assert.doesNotThrow(() => {
      validateConfig({
        ...kValidConfig,
        missingLabelStrategy: "error"
      });
    });
  });

  it("property 'missingLabelStrategy' must be string", () => {
    assert.throws(() => {
      validateConfig({
        ...kValidConfig,
        missingLabelStrategy: {} as any
      });
    }, {
      name: "Error",
      message: "Invalid config: /missingLabelStrategy: must be string"
    });
  });

  it("property 'missingLabelStrategy' must be equal to one of the allowed values", () => {
    assert.throws(() => {
      validateConfig({
        ...kValidConfig,
        missingLabelStrategy: "foo" as any
      });
    }, {
      name: "Error",
      message: "Invalid config: /missingLabelStrategy: must be equal to one of the allowed values"
    });
  });

  for (const severity of kValidAlertSeverities) {
    it(`property 'defaultSeverity' can be ${severity}`, () => {
      assert.doesNotThrow(() => {
        validateConfig({
          ...kValidConfig,
          defaultSeverity: severity
        });
      });
    });
  }

  it("property 'defaultSeverity' cannot be another value", () => {
    assert.throws(() => {
      validateConfig({
        ...kValidConfig,
        defaultSeverity: "foo" as any
      });
    }, {
      name: "Error",
      message: "Invalid config: /defaultSeverity: must be equal to one of the allowed values"
    });
  });

  it("property 'selfMonitoring' should be optional", () => {
    assert.doesNotThrow(() => {
      validateConfig({
        ...kValidConfig,
        selfMonitoring: undefined
      });
    });
  });

  it("property 'selfMonitoring' can be set", () => {
    assert.doesNotThrow(() => {
      validateConfig({
        ...kValidConfig,
        selfMonitoring: {
          template: {
            title: "foo"
          },
          notifiers: ["discord"]
        }
      });
    });
  });

  it("property 'selfMonitoring.template' should be required", () => {
    assert.throws(() => {
      validateConfig({
        ...kValidConfig,
        selfMonitoring: {
          template: undefined as any,
          notifiers: ["discord"]
        }
      });
    }, {
      name: "Error",
      message: "Invalid config: /selfMonitoring: must have required property 'template'"
    });
  });

  it("property 'selfMonitoring.template' can be a string", () => {
    assert.doesNotThrow(() => {
      validateConfig({
        ...kValidConfig,
        selfMonitoring: {
          template: "foo",
          notifiers: ["discord"]
        }
      });
    });
  });

  it("property 'selfMonitoring.template' can be an object with title", () => {
    assert.doesNotThrow(() => {
      validateConfig({
        ...kValidConfig,
        selfMonitoring: {
          template: {
            title: "foo"
          },
          notifiers: ["discord"]
        }
      });
    });
  });

  it("property 'selfMonitoring.template' can be an object with content", () => {
    assert.doesNotThrow(() => {
      validateConfig({
        ...kValidConfig,
        selfMonitoring: {
          template: {
            content: ["foo"]
          },
          notifiers: ["discord"]
        }
      });
    });
  });

  it("property 'selfMonitoring.template' can be an object with both title & content", () => {
    assert.doesNotThrow(() => {
      validateConfig({
        ...kValidConfig,
        selfMonitoring: {
          template: {
            title: "foo",
            content: ["foo"]
          },
          notifiers: ["discord"]
        }
      });
    });
  });

  it("property 'selfMonitoring.notifiers' should be required", () => {
    assert.throws(() => {
      validateConfig({
        ...kValidConfig,
        selfMonitoring: {
          template: "foo",
          notifiers: undefined as any
        }
      });
    }, {
      name: "Error",
      message: "Invalid config: /selfMonitoring: must have required property 'notifiers'"
    });
  });

  it("property 'selfMonitoring.notifiers' must be array", () => {
    assert.throws(() => {
      validateConfig({
        ...kValidConfig,
        selfMonitoring: {
          template: "foo",
          notifiers: "foo" as any
        }
      });
    }, {
      name: "Error",
      message: "Invalid config: /selfMonitoring/notifiers: must be array"
    });
  });

  it("property 'selfMonitoring.notifiers' must be string array", () => {
    assert.throws(() => {
      validateConfig({
        ...kValidConfig,
        selfMonitoring: {
          template: "foo",
          notifiers: [true] as any
        }
      });
    }, {
      name: "Error",
      message: "Invalid config: /selfMonitoring/notifiers/0: must be string"
    });
  });

  it("property 'selfMonitoring.notifiers' must have at least one item", () => {
    assert.throws(() => {
      validateConfig({
        ...kValidConfig,
        selfMonitoring: {
          template: "foo",
          notifiers: []
        }
      });
    }, {
      name: "Error",
      message: "Invalid config: /selfMonitoring/notifiers: must NOT have fewer than 1 items"
    });
  });

  it("property 'selfMonitoring.errorFilters' should be optional", () => {
    assert.doesNotThrow(() => {
      validateConfig({
        ...kValidConfig,
        selfMonitoring: {
          template: "foo",
          notifiers: ["foo"],
          errorFilters: undefined
        }
      });
    });
  });

  it("property 'selfMonitoring.errorFilters' must be array", () => {
    assert.throws(() => {
      validateConfig({
        ...kValidConfig,
        selfMonitoring: {
          template: "foo",
          notifiers: ["foo"],
          errorFilters: "foo" as any
        }
      });
    }, {
      name: "Error",
      message: "Invalid config: /selfMonitoring/errorFilters: must be array"
    });
  });

  it("property 'selfMonitoring.errorFilters' must be string array", () => {
    assert.throws(() => {
      validateConfig({
        ...kValidConfig,
        selfMonitoring: {
          template: "foo",
          notifiers: ["foo"],
          errorFilters: [true] as any
        }
      });
    }, {
      name: "Error",
      message: "Invalid config: /selfMonitoring/errorFilters/0: must be string"
    });
  });

  it("property 'selfMonitoring.ruleFilters' should be optional", () => {
    assert.doesNotThrow(() => {
      validateConfig({
        ...kValidConfig,
        selfMonitoring: {
          template: "foo",
          notifiers: ["foo"],
          ruleFilters: undefined
        }
      });
    });
  });

  it("property 'selfMonitoring.ruleFilters' must be array", () => {
    assert.throws(() => {
      validateConfig({
        ...kValidConfig,
        selfMonitoring: {
          template: "foo",
          notifiers: ["foo"],
          ruleFilters: "foo" as any
        }
      });
    }, {
      name: "Error",
      message: "Invalid config: /selfMonitoring/ruleFilters: must be array"
    });
  });

  it("property 'selfMonitoring.ruleFilters' must be string array", () => {
    assert.throws(() => {
      validateConfig({
        ...kValidConfig,
        selfMonitoring: {
          template: "foo",
          notifiers: ["foo"],
          ruleFilters: [true] as any
        }
      });
    }, {
      name: "Error",
      message: "Invalid config: /selfMonitoring/ruleFilters/0: must be string"
    });
  });

  it("property 'selfMonitoring.minimumErrorCount' should be optional", () => {
    assert.doesNotThrow(() => {
      validateConfig({
        ...kValidConfig,
        selfMonitoring: {
          template: "foo",
          notifiers: ["foo"],
          minimumErrorCount: undefined
        }
      });
    });
  });

  it("property 'selfMonitoring.ruleFilters' must be integer", () => {
    assert.throws(() => {
      validateConfig({
        ...kValidConfig,
        selfMonitoring: {
          template: "foo",
          notifiers: ["foo"],
          minimumErrorCount: 5.5
        }
      });
    }, {
      name: "Error",
      message: "Invalid config: /selfMonitoring/minimumErrorCount: must be integer"
    });
  });

  it("property 'selfMonitoring.throttle' should be optional", () => {
    assert.doesNotThrow(() => {
      validateConfig({
        ...kValidConfig,
        selfMonitoring: {
          template: "foo",
          notifiers: ["foo"],
          throttle: undefined
        }
      });
    });
  });

  it("property 'selfMonitoring.throttle' must be an object", () => {
    assert.throws(() => {
      validateConfig({
        ...kValidConfig,
        selfMonitoring: {
          template: "foo",
          notifiers: ["foo"],
          throttle: "hello" as any
        }
      });
    }, {
      name: "Error",
      message: "Invalid config: /selfMonitoring/throttle: must be object"
    });
  });

  it("property 'selfMonitoring.throttle.count' should be optional", () => {
    assert.doesNotThrow(() => {
      validateConfig({
        ...kValidConfig,
        selfMonitoring: {
          template: "foo",
          notifiers: ["foo"],
          throttle: {
            interval: "1m",
            count: undefined
          }
        }
      });
    });
  });

  it("property 'selfMonitoring.throttle.count' cannot be float", () => {
    assert.throws(() => {
      validateConfig({
        ...kValidConfig,
        selfMonitoring: {
          template: "foo",
          notifiers: ["foo"],
          throttle: {
            interval: "1m",
            count: 5.5
          }
        }
      });
    }, {
      name: "Error",
      message: "Invalid config: /selfMonitoring/throttle/count: must be integer"
    });
  });

  it("property 'selfMonitoring.throttle.interval' should be required", () => {
    assert.throws(() => {
      validateConfig({
        ...kValidConfig,
        selfMonitoring: {
          template: "foo",
          notifiers: ["foo"],
          throttle: {
            interval: undefined as any
          }
        }
      });
    }, {
      name: "Error",
      message: "Invalid config: /selfMonitoring/throttle: must have required property 'interval'"
    });
  });

  it("property 'selfMonitoring.throttle.interval' must be a string", () => {
    assert.throws(() => {
      validateConfig({
        ...kValidConfig,
        selfMonitoring: {
          template: "foo",
          notifiers: ["foo"],
          throttle: {
            interval: 55 as any
          }
        }
      });
    }, {
      name: "Error",
      message: "Invalid config: /selfMonitoring/throttle/interval: must be string"
    });
  });

  it("property 'selfMonitoring.throttle.count' must be an integer", () => {
    assert.throws(() => {
      validateConfig({
        ...kValidConfig,
        selfMonitoring: {
          template: "foo",
          notifiers: ["foo"],
          throttle: {
            interval: "1m",
            count: "5" as any
          }
        }
      });
    }, {
      name: "Error",
      message: "Invalid config: /selfMonitoring/throttle/count: must be integer"
    });
  });
});
