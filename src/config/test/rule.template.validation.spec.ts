/* eslint-disable max-len */
// Import Node.js Dependencies
import assert from "node:assert";
import { describe, it } from "node:test";

// Import Internal Dependencies
import { validateConfig } from "../src/validate";
import { VALID_CONFIG } from "./helpers";

describe("Rule template validations", () => {
  it("given a rule template with only title, it should validate", () => {
    assert.doesNotThrow(() => {
      validateConfig({
        ...VALID_CONFIG,
        rules: [
          {
            ...VALID_CONFIG.rules[0],
            alert: {
              ...VALID_CONFIG.rules[0].alert,
              template: {
                title: "foo"
              }
            }
          }
        ]
      });
    });
  });

  it("given a rule template with only content, it should validate", () => {
    assert.doesNotThrow(() => {
      validateConfig({
        ...VALID_CONFIG,
        rules: [
          {
            ...VALID_CONFIG.rules[0],
            alert: {
              ...VALID_CONFIG.rules[0].alert,
              template: {
                content: ["foo"]
              }
            }
          }
        ]
      });
    });
  });

  it("given an extended template (rule) which does not exists, it should throws", () => {
    assert.throws(() => {
      validateConfig({
        ...VALID_CONFIG,
        templates: {
          foo: {
            content: ["foo"]
          }
        },
        rules: [
          {
            ...VALID_CONFIG.rules[0],
            alert: {
              ...VALID_CONFIG.rules[0].alert,
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

  it("given a rule template with empty title, it should throws", () => {
    assert.throws(() => {
      validateConfig({
        ...VALID_CONFIG,
        rules: [
          {
            ...VALID_CONFIG.rules[0],
            alert: {
              ...VALID_CONFIG.rules[0].alert,
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
        ...VALID_CONFIG,
        rules: [
          {
            ...VALID_CONFIG.rules[0],
            alert: {
              ...VALID_CONFIG.rules[0].alert,
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
        ...VALID_CONFIG,
        rules: [
          {
            ...VALID_CONFIG.rules[0],
            alert: {
              ...VALID_CONFIG.rules[0].alert,
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

  it("given a rule non-extended template with empty content and valid title, it should throws", () => {
    assert.throws(() => {
      validateConfig({
        ...VALID_CONFIG,
        rules: [
          {
            ...VALID_CONFIG.rules[0],
            alert: {
              ...VALID_CONFIG.rules[0].alert,
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

  it("given a rule template without title and content, it should throws", () => {
    assert.throws(() => {
      validateConfig({
        ...VALID_CONFIG,
        rules: [
          {
            ...VALID_CONFIG.rules[0],
            alert: {
              ...VALID_CONFIG.rules[0].alert,
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

  it("given root rule template, it should validate", () => {
    assert.doesNotThrow(() => {
      validateConfig({
        ...VALID_CONFIG,
        templates: {
          foo: {
            content: ["foo"]
          }
        },
        rules: [
          {
            ...VALID_CONFIG.rules[0],
            alert: {
              ...VALID_CONFIG.rules[0].alert,
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
        ...VALID_CONFIG,
        rules: [
          {
            ...VALID_CONFIG.rules[0],
            alert: {
              ...VALID_CONFIG.rules[0].alert,
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
});
