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

  it("given a root template with only cotnent, it should validate", () => {
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

  it("given a rule template with empty content, it should throws", () => {
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
      message: "Invalid config: /rules/0/alert/template/content: must NOT have fewer than 1 items, /rules/0/alert/template: must be string, /rules/0/alert/template: must match exactly one schema in oneOf"
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

  it("given a rule template with empty content and valid title, it should throws", () => {
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
      message: "Invalid config: /rules/0/alert/template/content: must NOT have fewer than 1 items, /rules/0/alert/template: must be string, /rules/0/alert/template: must match exactly one schema in oneOf"
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
      message: "Invalid config: /rules/0/alert/template: must have required property 'title', /rules/0/alert/template: must have required property 'content', /rules/0/alert/template: must match a schema in anyOf, /rules/0/alert/template: must be string, /rules/0/alert/template: must match exactly one schema in oneOf"
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
      message: "Invalid config: /templates/foo: must have required property 'title', /templates/foo: must have required property 'content', /templates/foo: must match a schema in anyOf"
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

  it("rule logql should not be empty", () => {
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
      message: "Invalid config: /rules/0/logql: must NOT have fewer than 1 characters"
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
      message: "Invalid config: /rules/0/alert/on: must have required property 'count', /rules/0/alert/on: must have required property 'label', /rules/0/alert/on: must have required property 'label', /rules/0/alert/on: must match a schema in anyOf"
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

  it("rule alert property 'on.value' should be required when rule is label based", () => {
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
                thresholdPercent: 80
              }
            }
          }
        ]
      });
    }, {
      name: "Error",
      message: "Invalid config: /rules/0/alert/on: must have required property 'count', /rules/0/alert/on: must have required property 'value', /rules/0/alert/on: must have required property 'value', /rules/0/alert/on: must match a schema in anyOf"
    });
  });

  it("rule alert property 'on.thresholdPercent' should be required when rule is label based", () => {
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
      message: "Invalid config: /rules/0/alert/on: must have required property 'count', /rules/0/alert/on: must have required property 'thresholdPercent', /rules/0/alert/on: must have required property 'thresholdPercent', /rules/0/alert/on: must match a schema in anyOf"
    });
  });

  it("rule alert property 'on.thresholdPercent' cannot be float", () => {
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
                thresholdPercent: 80.5
              }
            }
          }
        ]
      });
    }, {
      name: "Error",
      message: "Invalid config: /rules/0/alert/on/thresholdPercent: must be integer"
    });
  });

  it("rule alert can be alert based", () => {
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
                label: "foo",
                value: "bar",
                thresholdPercent: 80
              }
            }
          }
        ]
      });
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
      message: "Invalid config: /rules/0/alert/on: must have required property 'interval', /rules/0/alert/on: must have required property 'label', /rules/0/alert/on: must have required property 'label', /rules/0/alert/on: must match a schema in anyOf"
    });
  });

  it("rule alert property 'on.interval' should be required when rule is label based and no count", () => {
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
                interval: undefined as any,
                count: undefined as any,
                label: "foo",
                value: "bar"
              }
            }
          }
        ]
      });
    }, {
      name: "Error",
      message: "Invalid config: /rules/0/alert/on: must have required property 'count', /rules/0/alert/on: must have required property 'thresholdPercent', /rules/0/alert/on: must have required property 'thresholdPercent', /rules/0/alert/on: must match a schema in anyOf"
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
});
