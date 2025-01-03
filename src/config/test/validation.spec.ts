
// Import Node.js Dependencies
import assert from "node:assert";
import { describe, it } from "node:test";

// Import Internal Dependencies
import { validateConfig } from "../src/validate";
import { VALID_ALERT_SEVERITIES, VALID_CONFIG } from "./helpers";

describe("Config validation", () => {
  it("should validate a valid config", () => {
    assert.doesNotThrow(() => {
      validateConfig(VALID_CONFIG);
    });
  });

  it("given a config without loki", () => {
    assert.throws(() => {
      validateConfig({
        ...VALID_CONFIG,
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
        ...VALID_CONFIG,
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
        ...VALID_CONFIG,
        loki: {
          apiUrl: 42 as any
        }
      });
    }, {
      name: "Error",
      message: "Invalid config: /loki/apiUrl: must be string"
    });
  });

  it("given a config without grafana", () => {
    assert.throws(() => {
      validateConfig({
        ...VALID_CONFIG,
        grafana: undefined as any
      });
    }, {
      name: "Error",
      message: "Invalid config: : must have required property 'grafana'"
    });
  });

  it("given a config without grafana apiUrl, it should throws", () => {
    assert.throws(() => {
      validateConfig({
        ...VALID_CONFIG,
        grafana: {} as any
      });
    }, {
      name: "Error",
      message: "Invalid config: /grafana: must have required property 'apiUrl'"
    });
  });

  it("grafana apiUrl must be string", () => {
    assert.throws(() => {
      validateConfig({
        ...VALID_CONFIG,
        grafana: {
          apiUrl: 42 as any
        }
      });
    }, {
      name: "Error",
      message: "Invalid config: /grafana/apiUrl: must be string"
    });
  });

  it("given a root template with only title, it should validate", () => {
    assert.doesNotThrow(() => {
      validateConfig({
        ...VALID_CONFIG,
        templates: {
          foo: {
            title: "foo"
          }
        }
      });
    });
  });

  it("given an extended template with title only, it should validate", () => {
    assert.doesNotThrow(() => {
      validateConfig({
        ...VALID_CONFIG,
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
        ...VALID_CONFIG,
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
        ...VALID_CONFIG,
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
        ...VALID_CONFIG,
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
        ...VALID_CONFIG,
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
        ...VALID_CONFIG,
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
        ...VALID_CONFIG,
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
        ...VALID_CONFIG,
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

  it("given a root template with only content, it should validate", () => {
    assert.doesNotThrow(() => {
      validateConfig({
        ...VALID_CONFIG,
        templates: {
          foo: {
            content: ["foo"]
          }
        }
      });
    });
  });

  it("given a root template with empty title and valid content, it should throws", () => {
    assert.throws(() => {
      validateConfig({
        ...VALID_CONFIG,
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

  it("given a root template with empty content and valid title, it should throws", () => {
    assert.throws(() => {
      validateConfig({
        ...VALID_CONFIG,
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

  it("given a root template without title and content, it should throws", () => {
    assert.throws(() => {
      validateConfig({
        ...VALID_CONFIG,
        templates: {
          foo: {}
        }
      });
    }, {
      name: "Error",
      // eslint-disable-next-line @stylistic/max-len
      message: "Invalid config: /templates/foo: must have required property 'title', /templates/foo: must have required property 'content', /templates/foo: must have required property 'extends', /templates/foo: must match a schema in anyOf"
    });
  });

  it("property 'missingLabelStrategy' should be optional", () => {
    assert.doesNotThrow(() => {
      validateConfig({
        ...VALID_CONFIG,
        missingLabelStrategy: undefined
      });
    });
  });

  it("property 'missingLabelStrategy' can be 'ignore'", () => {
    assert.doesNotThrow(() => {
      validateConfig({
        ...VALID_CONFIG,
        missingLabelStrategy: "ignore"
      });
    });
  });

  it("property 'missingLabelStrategy' can be 'error'", () => {
    assert.doesNotThrow(() => {
      validateConfig({
        ...VALID_CONFIG,
        missingLabelStrategy: "error"
      });
    });
  });

  it("property 'missingLabelStrategy' must be string", () => {
    assert.throws(() => {
      validateConfig({
        ...VALID_CONFIG,
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
        ...VALID_CONFIG,
        missingLabelStrategy: "foo" as any
      });
    }, {
      name: "Error",
      message: "Invalid config: /missingLabelStrategy: must be equal to one of the allowed values"
    });
  });

  for (const severity of VALID_ALERT_SEVERITIES) {
    it(`property 'defaultSeverity' can be ${severity}`, () => {
      assert.doesNotThrow(() => {
        validateConfig({
          ...VALID_CONFIG,
          defaultSeverity: severity
        });
      });
    });
  }

  it("property 'defaultSeverity' cannot be another value", () => {
    assert.throws(() => {
      validateConfig({
        ...VALID_CONFIG,
        defaultSeverity: "foo" as any
      });
    }, {
      name: "Error",
      message: "Invalid config: /defaultSeverity: must be equal to one of the allowed values"
    });
  });

  it("property 'notifiers.notifier' should be required", () => {
    assert.throws(() => {
      validateConfig({
        ...VALID_CONFIG,
        notifiers: {
          discord: {
            notifier: undefined as any,
            webhookUrl: "https://foo.bar"
          }
        }
      });
    }, {
      name: "Error",
      message: "Invalid config: /notifiers/discord: must have required property 'notifier'"
    });
  });

  it("property 'notifiers.notifier' should be string", () => {
    assert.throws(() => {
      validateConfig({
        ...VALID_CONFIG,
        notifiers: {
          discord: {
            notifier: true as any,
            webhookUrl: "https://foo.bar"
          }
        }
      });
    }, {
      name: "Error",
      message: "Invalid config: /notifiers/discord/notifier: must be string"
    });
  });
});
