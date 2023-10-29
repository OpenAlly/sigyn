// Import Node.js Dependencies
import assert from "node:assert";
import { describe, it } from "node:test";

// Import Internal Dependencies
import { validateConfig } from "../src/validate";
import { VALID_CONFIG } from "./helpers";


// CONSTANTS
const kDurations = [
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

describe("Self-monitoring validations", () => {
  it("property 'selfMonitoring' should be optional", () => {
    assert.doesNotThrow(() => {
      validateConfig({
        ...VALID_CONFIG,
        selfMonitoring: undefined
      });
    });
  });

  it("property 'selfMonitoring' can be set", () => {
    assert.doesNotThrow(() => {
      validateConfig({
        ...VALID_CONFIG,
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
        ...VALID_CONFIG,
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
        ...VALID_CONFIG,
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
        ...VALID_CONFIG,
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
        ...VALID_CONFIG,
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
        ...VALID_CONFIG,
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
        ...VALID_CONFIG,
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
        ...VALID_CONFIG,
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
        ...VALID_CONFIG,
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
        ...VALID_CONFIG,
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
        ...VALID_CONFIG,
        selfMonitoring: {
          template: "foo",
          notifiers: ["discord"],
          errorFilters: undefined
        }
      });
    });
  });

  it("property 'selfMonitoring.errorFilters' must be array", () => {
    assert.throws(() => {
      validateConfig({
        ...VALID_CONFIG,
        selfMonitoring: {
          template: "foo",
          notifiers: ["discord"],
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
        ...VALID_CONFIG,
        selfMonitoring: {
          template: "foo",
          notifiers: ["discord"],
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
        ...VALID_CONFIG,
        selfMonitoring: {
          template: "foo",
          notifiers: ["discord"],
          ruleFilters: undefined
        }
      });
    });
  });

  it("property 'selfMonitoring.ruleFilters' must be array", () => {
    assert.throws(() => {
      validateConfig({
        ...VALID_CONFIG,
        selfMonitoring: {
          template: "foo",
          notifiers: ["discord"],
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
        ...VALID_CONFIG,
        selfMonitoring: {
          template: "foo",
          notifiers: ["discord"],
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
        ...VALID_CONFIG,
        selfMonitoring: {
          template: "foo",
          notifiers: ["discord"],
          minimumErrorCount: undefined
        }
      });
    });
  });

  it("property 'selfMonitoring.ruleFilters' must be integer", () => {
    assert.throws(() => {
      validateConfig({
        ...VALID_CONFIG,
        selfMonitoring: {
          template: "foo",
          notifiers: ["discord"],
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
        ...VALID_CONFIG,
        selfMonitoring: {
          template: "foo",
          notifiers: ["discord"],
          throttle: undefined
        }
      });
    });
  });

  it("property 'selfMonitoring.throttle' must be an object", () => {
    assert.throws(() => {
      validateConfig({
        ...VALID_CONFIG,
        selfMonitoring: {
          template: "foo",
          notifiers: ["discord"],
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
        ...VALID_CONFIG,
        selfMonitoring: {
          template: "foo",
          notifiers: ["discord"],
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
        ...VALID_CONFIG,
        selfMonitoring: {
          template: "foo",
          notifiers: ["discord"],
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
        ...VALID_CONFIG,
        selfMonitoring: {
          template: "foo",
          notifiers: ["discord"],
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
        ...VALID_CONFIG,
        selfMonitoring: {
          template: "foo",
          notifiers: ["discord"],
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

  it("property 'selfMonitoring.interval' must be a duration", () => {
    assert.throws(() => {
      validateConfig({
        ...VALID_CONFIG,
        selfMonitoring: {
          template: "foo",
          notifiers: ["discord"],
          throttle: {
            interval: "foo"
          }
        }
      });
    }, {
      name: "Error",
      // eslint-disable-next-line max-len
      message: "Invalid config: /selfMonitoring/throttle/interval: must match pattern \"^((?:\\d+)?\\.?\\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$\""
    });
  });

  for (const duration of kDurations) {
    it(`property 'selfMonitoring.interval' can be '${duration}'`, () => {
      assert.doesNotThrow(() => {
        validateConfig({
          ...VALID_CONFIG,
          selfMonitoring: {
            template: "foo",
            notifiers: ["discord"],
            throttle: {
              interval: duration
            }
          }
        });
      });
    });
  }

  it("property 'selfMonitoring.throttle.count' must be an integer", () => {
    assert.throws(() => {
      validateConfig({
        ...VALID_CONFIG,
        selfMonitoring: {
          template: "foo",
          notifiers: ["discord"],
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

  it("rule alert property 'throttle.activationThreshold' can be set", () => {
    assert.doesNotThrow(() => {
      validateConfig({
        ...VALID_CONFIG,
        selfMonitoring: {
          template: "foo",
          notifiers: ["discord"],
          throttle: {
            interval: "1m",
            activationThreshold: 5
          }
        }
      });
    });
  });

  it("rule alert property 'throttle.activationThreshold' cannot be float", () => {
    assert.throws(() => {
      validateConfig({
        ...VALID_CONFIG,
        selfMonitoring: {
          template: "foo",
          notifiers: ["discord"],
          throttle: {
            interval: "1m",
            activationThreshold: 5.5
          }
        }
      });
    }, {
      name: "Error",
      message: "Invalid config: /selfMonitoring/throttle/activationThreshold: must be integer"
    });
  });

  it("property 'selfMonitoring.notifiers' must be root referenced notifiers", () => {
    assert.throws(() => {
      validateConfig({
        ...VALID_CONFIG,
        selfMonitoring: {
          template: "foo",
          notifiers: ["slack"]
        }
      });
    }, {
      name: "Error",
      message: "Notifier 'slack' not found"
    });
  });
});
