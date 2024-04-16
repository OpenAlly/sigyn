/* eslint-disable max-lines */
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

describe("Composite rules validations", () => {
  it("property 'compositeRules' should be optional", () => {
    assert.doesNotThrow(() => {
      validateConfig({
        ...VALID_CONFIG,
        compositeRules: undefined
      });
    });
  });

  it("compositeRules property 'name' should be required", () => {
    assert.throws(() => {
      validateConfig({
        ...VALID_CONFIG,
        compositeRules: [
          {
            notifCount: 12,
            template: {
              title: "title"
            },
            name: undefined as any
          }
        ]
      });
    }, {
      name: "Error",
      message: "Invalid config: /compositeRules/0: must have required property 'name'"
    });
  });

  it("compositeRules property 'name' should be string", () => {
    assert.throws(() => {
      validateConfig({
        ...VALID_CONFIG,
        compositeRules: [
          {
            notifCount: 12,
            template: {
              title: "title"
            },
            name: true as any
          }
        ]
      });
    }, {
      name: "Error",
      message: "Invalid config: /compositeRules/0/name: must be string"
    });
  });

  it("compositeRules property 'name' should be unique", () => {
    assert.throws(() => {
      validateConfig({
        ...VALID_CONFIG,
        compositeRules: [
          {
            notifCount: 12,
            template: {
              title: "title"
            },
            name: "foo"
          },
          {
            notifCount: 12,
            template: {
              title: "title"
            },
            name: "foo"
          }
        ]
      });
    }, {
      name: "Error",
      message: "Invalid config: /compositeRules: must pass \"uniqueItemProperties\" keyword validation"
    });
  });

  it("compositeRules property 'notifCount' should be required", () => {
    assert.throws(() => {
      validateConfig({
        ...VALID_CONFIG,
        compositeRules: [
          {
            notifCount: undefined as any,
            template: {
              title: "title"
            },
            name: "foo"
          }
        ]
      });
    }, {
      name: "Error",
      message: "Invalid config: /compositeRules/0: must have required property 'notifCount'"
    });
  });

  it("compositeRules property 'notifCount' should be integer", () => {
    assert.throws(() => {
      validateConfig({
        ...VALID_CONFIG,
        compositeRules: [
          {
            notifCount: 5.5,
            template: {
              title: "title"
            },
            name: "foo"
          }
        ]
      });
    }, {
      name: "Error",
      message: "Invalid config: /compositeRules/0/notifCount: must be integer"
    });
  });

  it("compositeRules property 'ruleCountThreshold' should be optional", () => {
    assert.doesNotThrow(() => {
      validateConfig({
        ...VALID_CONFIG,
        compositeRules: [
          {
            notifCount: 5,
            template: {
              title: "title"
            },
            name: "foo",
            ruleCountThreshold: undefined
          }
        ]
      });
    });
  });

  it("compositeRules property 'ruleCountThreshold' should be integer", () => {
    assert.throws(() => {
      validateConfig({
        ...VALID_CONFIG,
        compositeRules: [
          {
            notifCount: 5,
            template: {
              title: "title"
            },
            name: "foo",
            ruleCountThreshold: 5.5
          }
        ]
      });
    }, {
      name: "Error",
      message: "Invalid config: /compositeRules/0/ruleCountThreshold: must be integer"
    });
  });

  it("compositeRules property 'template' should be required", () => {
    assert.throws(() => {
      validateConfig({
        ...VALID_CONFIG,
        compositeRules: [
          {
            notifCount: 12,
            template: undefined as any,
            name: "foo"
          }
        ]
      });
    }, {
      name: "Error",
      message: "Invalid config: /compositeRules/0: must have required property 'template'"
    });
  });

  it("compositeRules property 'include' can be set", () => {
    assert.doesNotThrow(() => {
      validateConfig({
        ...VALID_CONFIG,
        compositeRules: [
          {
            notifCount: 12,
            template: {
              title: "title"
            },
            name: "foo",
            include: ["foo"]
          }
        ]
      });
    });
  });

  it("compositeRules property 'include' must be array", () => {
    assert.throws(() => {
      validateConfig({
        ...VALID_CONFIG,
        compositeRules: [
          {
            notifCount: 12,
            template: {
              title: "title"
            },
            name: "foo",
            include: "foo" as any
          }
        ]
      });
    }, {
      name: "Error",
      message: "Invalid config: /compositeRules/0/include: must be array"
    });
  });

  it("compositeRules property 'include' items must be string", () => {
    assert.throws(() => {
      validateConfig({
        ...VALID_CONFIG,
        compositeRules: [
          {
            notifCount: 12,
            template: {
              title: "title"
            },
            name: "foo",
            include: [5] as any
          }
        ]
      });
    }, {
      name: "Error",
      message: "Invalid config: /compositeRules/0/include/0: must be string"
    });
  });

  it("compositeRules property 'exclude' can be set", () => {
    assert.doesNotThrow(() => {
      validateConfig({
        ...VALID_CONFIG,
        compositeRules: [
          {
            notifCount: 12,
            template: {
              title: "title"
            },
            name: "foo",
            exclude: ["foo"]
          }
        ]
      });
    });
  });

  it("compositeRules property 'exclude' must be array", () => {
    assert.throws(() => {
      validateConfig({
        ...VALID_CONFIG,
        compositeRules: [
          {
            notifCount: 12,
            template: {
              title: "title"
            },
            name: "foo",
            exclude: "foo" as any
          }
        ]
      });
    }, {
      name: "Error",
      message: "Invalid config: /compositeRules/0/exclude: must be array"
    });
  });

  it("compositeRules property 'exclude' items must be string", () => {
    assert.throws(() => {
      validateConfig({
        ...VALID_CONFIG,
        compositeRules: [
          {
            notifCount: 12,
            template: {
              title: "title"
            },
            name: "foo",
            exclude: [5] as any
          }
        ]
      });
    }, {
      name: "Error",
      message: "Invalid config: /compositeRules/0/exclude/0: must be string"
    });
  });

  it("compositeRules property 'notifiers' can be set", () => {
    assert.doesNotThrow(() => {
      validateConfig({
        ...VALID_CONFIG,
        compositeRules: [
          {
            notifCount: 12,
            template: {
              title: "title"
            },
            name: "foo",
            notifiers: ["discord"]
          }
        ]
      });
    });
  });

  it("compositeRules property 'notifiers' must be array", () => {
    assert.throws(() => {
      validateConfig({
        ...VALID_CONFIG,
        compositeRules: [
          {
            notifCount: 12,
            template: {
              title: "title"
            },
            name: "foo",
            notifiers: "foo" as any
          }
        ]
      });
    }, {
      name: "Error",
      message: "Invalid config: /compositeRules/0/notifiers: must be array"
    });
  });

  it("compositeRules property 'notifiers' items must be string", () => {
    assert.throws(() => {
      validateConfig({
        ...VALID_CONFIG,
        compositeRules: [
          {
            notifCount: 12,
            template: {
              title: "title"
            },
            name: "foo",
            notifiers: [5] as any
          }
        ]
      });
    }, {
      name: "Error",
      message: "Invalid config: /compositeRules/0/notifiers/0: must be string"
    });
  });

  it("compositeRules property 'interval' can be set", () => {
    assert.doesNotThrow(() => {
      validateConfig({
        ...VALID_CONFIG,
        compositeRules: [
          {
            notifCount: 12,
            template: {
              title: "title"
            },
            name: "foo",
            interval: "15m"
          }
        ]
      });
    });
  });

  it("compositeRules property 'interval' must be string", () => {
    assert.throws(() => {
      validateConfig({
        ...VALID_CONFIG,
        compositeRules: [
          {
            notifCount: 12,
            template: {
              title: "title"
            },
            name: "foo",
            interval: true as any
          }
        ]
      });
    }, {
      name: "Error",
      message: "Invalid config: /compositeRules/0/interval: must be string"
    });
  });

  it("compositeRules property 'interval' must be a duration", () => {
    assert.throws(() => {
      validateConfig({
        ...VALID_CONFIG,
        compositeRules: [
          {
            notifCount: 12,
            template: {
              title: "title"
            },
            name: "foo",
            interval: "foo"
          }
        ]
      });
    }, {
      name: "Error",
      // eslint-disable-next-line max-len
      message: "Invalid config: /compositeRules/0/interval: must match pattern \"^((?:\\d+)?\\.?\\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$\""
    });
  });

  for (const duration of kDurations) {
    it(`compositeRules property 'interval' can be '${duration}'`, () => {
      assert.doesNotThrow(() => {
        validateConfig({
          ...VALID_CONFIG,
          compositeRules: [
            {
              notifCount: 12,
              template: {
                title: "title"
              },
              name: "foo",
              interval: duration
            }
          ]
        });
      });
    });
  }

  it("compositeRules property 'throttle' can be set", () => {
    assert.doesNotThrow(() => {
      validateConfig({
        ...VALID_CONFIG,
        compositeRules: [
          {
            notifCount: 12,
            template: {
              title: "title"
            },
            name: "foo",
            throttle: {
              interval: "1m",
              count: 5
            }
          }
        ]
      });
    });
  });

  it("compositeRules property 'throttle' must be an object", () => {
    assert.throws(() => {
      validateConfig({
        ...VALID_CONFIG,
        compositeRules: [
          {
            notifCount: 12,
            template: {
              title: "title"
            },
            name: "foo",
            throttle: "hello" as any
          }
        ]
      });
    }, {
      name: "Error",
      message: "Invalid config: /compositeRules/0/throttle: must be object"
    });
  });

  it("compositeRules property 'throttle.count' should be optional", () => {
    assert.doesNotThrow(() => {
      validateConfig({
        ...VALID_CONFIG,
        compositeRules: [
          {
            notifCount: 12,
            template: {
              title: "title"
            },
            name: "foo",
            throttle: {
              interval: "1m"
            }
          }
        ]
      });
    }, {
      name: "Error",
      message: "Invalid config: /compositeRules/0/throttle: must be object"
    });
  });

  it("compositeRules property 'throttle.count' cannot be float", () => {
    assert.throws(() => {
      validateConfig({
        ...VALID_CONFIG,
        compositeRules: [
          {
            notifCount: 12,
            template: {
              title: "title"
            },
            name: "foo",
            throttle: {
              interval: "1m",
              count: 5.5
            }
          }
        ]
      });
    }, {
      name: "Error",
      message: "Invalid config: /compositeRules/0/throttle/count: must be integer"
    });
  });

  it("compositeRules property 'throttle.interval' should be required", () => {
    assert.throws(() => {
      validateConfig({
        ...VALID_CONFIG,
        compositeRules: [
          {
            notifCount: 12,
            template: {
              title: "title"
            },
            name: "foo",
            throttle: {
              interval: undefined as any
            }
          }
        ]
      });
    }, {
      name: "Error",
      message: "Invalid config: /compositeRules/0/throttle: must have required property 'interval'"
    });
  });

  it("compositeRules property 'throttle.interval' must be string", () => {
    assert.throws(() => {
      validateConfig({
        ...VALID_CONFIG,
        compositeRules: [
          {
            notifCount: 12,
            template: {
              title: "title"
            },
            name: "foo",
            throttle: {
              interval: true as any
            }
          }
        ]
      });
    }, {
      name: "Error",
      message: "Invalid config: /compositeRules/0/throttle/interval: must be string"
    });
  });

  it("compositeRules property 'throttle.interval' must be a duration", () => {
    assert.throws(() => {
      validateConfig({
        ...VALID_CONFIG,
        compositeRules: [
          {
            notifCount: 12,
            template: {
              title: "title"
            },
            name: "foo",
            throttle: {
              interval: "foo"
            }
          }
        ]
      });
    }, {
      name: "Error",
      // eslint-disable-next-line max-len
      message: "Invalid config: /compositeRules/0/throttle/interval: must match pattern \"^((?:\\d+)?\\.?\\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$\""
    });
  });

  for (const duration of kDurations) {
    it(`compositeRules property 'throttle.interval' can be '${duration}'`, () => {
      assert.doesNotThrow(() => {
        validateConfig({
          ...VALID_CONFIG,
          compositeRules: [
            {
              notifCount: 12,
              template: {
                title: "title"
              },
              name: "foo",
              throttle: {
                interval: duration
              }
            }
          ]
        });
      });
    });
  }

  it("compositeRules property 'throttle.count' must be an integer", () => {
    assert.throws(() => {
      validateConfig({
        ...VALID_CONFIG,
        compositeRules: [
          {
            notifCount: 12,
            template: {
              title: "title"
            },
            name: "foo",
            throttle: {
              interval: "1m",
              count: "5" as any
            }
          }
        ]
      });
    }, {
      name: "Error",
      message: "Invalid config: /compositeRules/0/throttle/count: must be integer"
    });
  });

  it("compositeRules property 'muteRules' should be optional", () => {
    assert.doesNotThrow(() => {
      validateConfig({
        ...VALID_CONFIG,
        compositeRules: [
          {
            notifCount: 12,
            template: {
              title: "title"
            },
            name: "foo",
            muteRules: undefined
          }
        ]
      });
    });
  });

  it("compositeRules property 'muteRules' must be boolean", () => {
    assert.throws(() => {
      validateConfig({
        ...VALID_CONFIG,
        compositeRules: [
          {
            notifCount: 12,
            template: {
              title: "title"
            },
            name: "foo",
            muteRules: "yes" as any
          }
        ]
      });
    }, {
      name: "Error",
      message: "Invalid config: /compositeRules/0/muteRules: must be boolean"
    });
  });

  it("compositeRules property 'muteUntriggered' should be optional", () => {
    assert.doesNotThrow(() => {
      validateConfig({
        ...VALID_CONFIG,
        compositeRules: [
          {
            notifCount: 12,
            template: {
              title: "title"
            },
            name: "foo",
            muteUntriggered: undefined
          }
        ]
      });
    });
  });

  it("compositeRules property 'muteUntriggered' must be boolean", () => {
    assert.throws(() => {
      validateConfig({
        ...VALID_CONFIG,
        compositeRules: [
          {
            notifCount: 12,
            template: {
              title: "title"
            },
            name: "foo",
            muteUntriggered: "yes" as any
          }
        ]
      });
    }, {
      name: "Error",
      message: "Invalid config: /compositeRules/0/muteUntriggered: must be boolean"
    });
  });

  it("compositeRules property 'muteDuration' should be optional", () => {
    assert.doesNotThrow(() => {
      validateConfig({
        ...VALID_CONFIG,
        compositeRules: [
          {
            notifCount: 12,
            template: {
              title: "title"
            },
            name: "foo",
            muteDuration: undefined
          }
        ]
      });
    });
  });

  it("compositeRules property 'muteDuration' must be string", () => {
    assert.throws(() => {
      validateConfig({
        ...VALID_CONFIG,
        compositeRules: [
          {
            notifCount: 12,
            template: {
              title: "title"
            },
            name: "foo",
            muteDuration: false as any
          }
        ]
      });
    }, {
      name: "Error",
      message: "Invalid config: /compositeRules/0/muteDuration: must be string"
    });
  });

  it("compositeRules property 'muteDuration' must be a duration", () => {
    assert.throws(() => {
      validateConfig({
        ...VALID_CONFIG,
        compositeRules: [
          {
            notifCount: 12,
            template: {
              title: "title"
            },
            name: "foo",
            muteDuration: "foo"
          }
        ]
      });
    }, {
      name: "Error",
      // eslint-disable-next-line max-len
      message: "Invalid config: /compositeRules/0/muteDuration: must match pattern \"^((?:\\d+)?\\.?\\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$\""
    });
  });

  for (const duration of kDurations) {
    it(`compositeRules property 'muteDuration' can be '${duration}'`, () => {
      assert.doesNotThrow(() => {
        validateConfig({
          ...VALID_CONFIG,
          compositeRules: [
            {
              notifCount: 12,
              template: {
                title: "title"
              },
              name: "foo",
              muteDuration: duration
            }
          ]
        });
      });
    });
  }

  it("compositeRules cannot have additional property", () => {
    assert.throws(() => {
      validateConfig({
        ...VALID_CONFIG,
        compositeRules: [
          {
            notifCount: 12,
            template: {
              title: "title"
            },
            name: "foo",
            throttle: {
              interval: "1m",
              foo: "bar"
            } as any
          }
        ]
      });
    }, {
      name: "Error",
      message: "Invalid config: /compositeRules/0/throttle: must NOT have additional properties"
    });
  });
});
