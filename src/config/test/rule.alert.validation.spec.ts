/* eslint-disable max-len */
// Import Node.js Dependencies
import assert from "node:assert";
import { describe, it } from "node:test";

// Import Internal Dependencies
import { validateConfig } from "../src/validate";
import { VALID_ALERT_SEVERITIES, VALID_CONFIG } from "./helpers";
import { PartialSigynAlert } from "../src/types";

// CONSTANTS
const kValidRule = VALID_CONFIG.rules[0];

function mergeAlert(alert: Partial<PartialSigynAlert>) {
  return {
    ...VALID_CONFIG,
    rules: [
      {
        ...kValidRule,
        alert: {
          ...VALID_CONFIG.rules[0].alert,
          ...alert
        }
      }
    ]
  };
}

describe("Rule alert validations", () => {
  it("rule alert should be required", () => {
    assert.throws(() => {
      validateConfig({
        ...VALID_CONFIG,
        rules: [
          {
            ...VALID_CONFIG.rules[0],
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
      validateConfig(mergeAlert({
        on: undefined as any
      }));
    }, {
      name: "Error",
      message: "Invalid config: /rules/0/alert: must have required property 'on'"
    });
  });

  it("rule alert property 'on.count' should be required", () => {
    assert.throws(() => {
      validateConfig(mergeAlert({
        on: {
          ...kValidRule.alert.on,
          count: undefined as any
        }
      }));
    }, {
      name: "Error",
      message: "Invalid config: /rules/0/alert/on: must have required property 'count'"
    });
  });

  it("rule alert property 'on.count' should be string or integer", () => {
    assert.throws(() => {
      validateConfig(mergeAlert({
        on: {
          ...kValidRule.alert.on,
          count: true as any
        }
      }));
    }, {
      name: "Error",
      message: "Invalid config: /rules/0/alert/on/count: must be integer, /rules/0/alert/on/count: must be string, /rules/0/alert/on/count: must match exactly one schema in oneOf"
    });
  });

  it("rule alert property 'on.count' cannot be float", () => {
    assert.throws(() => {
      validateConfig(mergeAlert({
        on: {
          ...kValidRule.alert.on,
          count: 50.5
        }
      }));
    }, {
      name: "Error",
      message: "Invalid config: /rules/0/alert/on/count: must be integer, /rules/0/alert/on/count: must be string, /rules/0/alert/on/count: must match exactly one schema in oneOf"
    });
  });

  it("rule alert property 'on.value' OR `on.valueMatch` should be required when rule is label based", () => {
    assert.throws(() => {
      validateConfig(mergeAlert({
        on: {
          ...kValidRule.alert.on,
          count: undefined,
          label: "foo",
          percentThreshold: 80
        }
      }));
    }, {
      name: "Error",
      message: "Invalid config: /rules/0/alert/on: must have required property 'value', /rules/0/alert/on: must have required property 'valueMatch', /rules/0/alert/on: must match exactly one schema in oneOf"
    });
  });

  it("rule alert property 'on.count' should be required when rule is label count based", () => {
    assert.throws(() => {
      validateConfig(mergeAlert({
        on: {
          ...kValidRule.alert.on,
          count: undefined,
          label: "foo",
          value: "bar"
        }
      }));
    }, {
      name: "Error",
      message: "Invalid config: /rules/0/alert/on: must have property count when property label is present"
    });
  });

  it("rule alert property 'on.percentThreshold' cannot be float", () => {
    assert.throws(() => {
      validateConfig(mergeAlert({
        on: {
          ...kValidRule.alert.on,
          count: undefined,
          label: "foo",
          value: "bar",
          percentThreshold: 80.5
        }
      }));
    }, {
      name: "Error",
      message: "Invalid config: /rules/0/alert/on/percentThreshold: must be integer"
    });
  });

  it("rule alert can be label based (value)", () => {
    assert.doesNotThrow(() => {
      validateConfig(mergeAlert({
        on: {
          ...kValidRule.alert.on,
          count: undefined,
          label: "foo",
          value: "bar",
          percentThreshold: 80
        }
      }));
    });
  });

  it("rule alert can be label based (valueMatch)", () => {
    assert.doesNotThrow(() => {
      validateConfig(mergeAlert({
        on: {
          ...kValidRule.alert.on,
          count: undefined,
          label: "foo",
          valueMatch: "bar",
          percentThreshold: 80
        }
      }));
    });
  });

  it("rule label alert cannot be based on both percentThreshold and count", () => {
    assert.throws(() => {
      validateConfig(mergeAlert({
        on: {
          ...kValidRule.alert.on,
          count: 10,
          label: "foo",
          value: "bar",
          percentThreshold: 80
        }
      }));
    }, {
      name: "Error",
      // TODO: the message should be more explicit
      message: "Invalid config: /rules/0/alert/on: must NOT be valid"
    });
  });

  it("rule alert property 'on.interval' should be required when rule is no label based", () => {
    assert.throws(() => {
      validateConfig(mergeAlert({
        on: {
          ...kValidRule.alert.on,
          interval: undefined as any
        }
      }));
    }, {
      name: "Error",
      message: "Invalid config: /rules/0/alert/on: must have required property 'interval'"
    });
  });

  it("rule alert property 'on.interval' or 'on.minimumLabelCount' should be required when rule is label percent threhsold based (value)", () => {
    assert.throws(() => {
      validateConfig(mergeAlert({
        on: {
          ...kValidRule.alert.on,
          count: undefined,
          interval: undefined,
          minimumLabelCount: undefined,
          label: "foo",
          value: "bar",
          percentThreshold: 80
        }
      }));
    }, {
      name: "Error",
      message: "Invalid config: /rules/0/alert/on: must have required property 'minimumLabelCount', /rules/0/alert/on: must have required property 'interval', /rules/0/alert/on: must match a schema in anyOf, /rules/0/alert/on: must have required property 'minimumLabelCount', /rules/0/alert/on: must have required property 'interval', /rules/0/alert/on: must match a schema in anyOf, /rules/0/alert/on: must match exactly one schema in oneOf"
    });
  });

  it("rule alert property 'on.interval' or 'on.minimumLabelCount' should be required when rule is label percent threhsold based (valueMatch)", () => {
    assert.throws(() => {
      validateConfig(mergeAlert({
        on: {
          ...kValidRule.alert.on,
          count: undefined,
          interval: undefined,
          minimumLabelCount: undefined,
          label: "foo",
          valueMatch: "bar",
          percentThreshold: 80
        }
      }));
    }, {
      name: "Error",
      message: "Invalid config: /rules/0/alert/on: must have required property 'minimumLabelCount', /rules/0/alert/on: must have required property 'interval', /rules/0/alert/on: must match a schema in anyOf, /rules/0/alert/on: must have required property 'minimumLabelCount', /rules/0/alert/on: must have required property 'interval', /rules/0/alert/on: must match a schema in anyOf, /rules/0/alert/on: must match exactly one schema in oneOf"
    });
  });

  it("rule label percent threshold based can have minimumLabelCount skiped when interval is set (value)", () => {
    assert.doesNotThrow(() => {
      validateConfig(mergeAlert({
        on: {
          ...kValidRule.alert.on,
          count: undefined,
          interval: "5m",
          minimumLabelCount: undefined,
          label: "foo",
          value: "bar",
          percentThreshold: 80
        }
      }));
    });
  });

  it("rule label percent threshold based can have minimumLabelCount skiped when interval is set (valueMatch)", () => {
    assert.doesNotThrow(() => {
      validateConfig(mergeAlert({
        on: {
          ...kValidRule.alert.on,
          count: undefined,
          interval: "5m",
          minimumLabelCount: undefined,
          label: "foo",
          valueMatch: "bar",
          percentThreshold: 80
        }
      }));
    });
  });

  it("rule label percent threshold based can have interval skiped when minimumLabelCount is set (value)", () => {
    assert.doesNotThrow(() => {
      validateConfig(mergeAlert({
        on: {
          ...kValidRule.alert.on,
          count: undefined,
          interval: undefined,
          minimumLabelCount: 50,
          label: "foo",
          value: "bar",
          percentThreshold: 80
        }
      }));
    });
  });

  it("rule label percent threshold based can have interval skiped when minimumLabelCount is set (valueMatch)", () => {
    assert.doesNotThrow(() => {
      validateConfig(mergeAlert({
        on: {
          ...kValidRule.alert.on,
          count: undefined,
          interval: undefined,
          minimumLabelCount: 50,
          label: "foo",
          value: "bar",
          percentThreshold: 80
        }
      }));
    });
  });

  it("rule count label does not need an interval or a minimumLabelCount (value)", () => {
    assert.doesNotThrow(() => {
      validateConfig(mergeAlert({
        on: {
          ...kValidRule.alert.on,
          count: 50,
          interval: undefined,
          minimumLabelCount: undefined,
          label: "foo",
          value: "bar"
        }
      }));
    });
  });

  it("rule count label does not need an interval or a minimumLabelCount (valueMatch)", () => {
    assert.doesNotThrow(() => {
      validateConfig(mergeAlert({
        on: {
          ...kValidRule.alert.on,
          count: 50,
          interval: undefined,
          minimumLabelCount: undefined,
          label: "foo",
          value: "bar"
        }
      }));
    });
  });

  it("rule label based cannot have both value and valueMatch", () => {
    assert.throws(() => {
      validateConfig(mergeAlert({
        on: {
          ...kValidRule.alert.on,
          count: 50,
          label: "foo",
          value: "bar",
          valueMatch: "baz"
        }
      }));
    }, {
      name: "Error",
      // TODO: should we have a better error message?
      message: "Invalid config: /rules/0/alert/on: must match exactly one schema in oneOf"
    });
  });

  it("rule alert property 'on.interval' should be a string", () => {
    assert.throws(() => {
      validateConfig(mergeAlert({
        on: {
          ...kValidRule.alert.on,
          interval: 15 as any
        }
      }));
    }, {
      name: "Error",
      message: "Invalid config: /rules/0/alert/on/interval: must be string"
    });
  });

  for (const severity of VALID_ALERT_SEVERITIES) {
    it(`rule alert property 'on.severity' can be ${severity}`, () => {
      assert.doesNotThrow(() => {
        validateConfig(mergeAlert({
          severity
        }));
      });
    });
  }

  it("rule alert property 'on.severity' cannot be another value", () => {
    assert.throws(() => {
      validateConfig(mergeAlert({
        severity: "foo" as any
      }));
    }, {
      name: "Error",
      message: "Invalid config: /rules/0/alert/severity: must be equal to one of the allowed values"
    });
  });

  it("rule alert property 'throttle' can be set", () => {
    assert.doesNotThrow(() => {
      validateConfig(mergeAlert({
        throttle: {
          interval: "1m",
          count: 5
        }
      }));
    });
  });

  it("rule alert property 'throttle' must be an object", () => {
    assert.throws(() => {
      validateConfig(mergeAlert({
        throttle: "hello" as any
      }));
    }, {
      name: "Error",
      message: "Invalid config: /rules/0/alert/throttle: must be object"
    });
  });

  it("rule alert property 'throttle.count' should be optional", () => {
    assert.doesNotThrow(() => {
      validateConfig(mergeAlert({
        throttle: {
          interval: "1m"
        }
      }));
    });
  });

  it("rule alert property 'throttle.count' cannot be float", () => {
    assert.throws(() => {
      validateConfig(mergeAlert({
        throttle: {
          interval: "1m",
          count: 5.5
        }
      }));
    }, {
      name: "Error",
      message: "Invalid config: /rules/0/alert/throttle/count: must be integer"
    });
  });

  it("rule alert property 'throttle.activationThreshold' can be set", () => {
    assert.doesNotThrow(() => {
      validateConfig(mergeAlert({
        throttle: {
          interval: "1m",
          activationThreshold: 5
        }
      }));
    });
  });

  it("rule alert property 'throttle.activationThreshold' cannot be float", () => {
    assert.throws(() => {
      validateConfig(mergeAlert({
        throttle: {
          interval: "1m",
          activationThreshold: 5.5
        }
      }));
    }, {
      name: "Error",
      message: "Invalid config: /rules/0/alert/throttle/activationThreshold: must be integer"
    });
  });

  it("rule alert property 'throttle.interval' should be required", () => {
    assert.throws(() => {
      validateConfig(mergeAlert({
        throttle: {
          interval: undefined as any
        }
      }));
    }, {
      name: "Error",
      message: "Invalid config: /rules/0/alert/throttle: must have required property 'interval'"
    });
  });

  it("rule alert property 'throttle.interval' must be a duration", () => {
    assert.throws(() => {
      validateConfig(mergeAlert({
        throttle: {
          interval: 5 as any
        }
      }));
    }, {
      name: "Error",
      message: "Invalid config: /rules/0/alert/throttle/interval: must be string"
    });
  });

  it("rule alert property 'throttle.count' must be an integer", () => {
    assert.throws(() => {
      validateConfig(mergeAlert({
        throttle: {
          interval: "1m",
          count: "5" as any
        }
      }));
    }, {
      name: "Error",
      message: "Invalid config: /rules/0/alert/throttle/count: must be integer"
    });
  });
});
