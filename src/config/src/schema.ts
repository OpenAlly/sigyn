// Import Third-party Dependencies
import { JSONSchemaType } from "ajv";

// Import Internal Dependencies
import { SigynAlert, SigynAlertTemplate, SigynConfig } from "./types";

const templateSchema: JSONSchemaType<SigynAlertTemplate> = {
  type: "object",
  properties: {
    title: {
      type: "string",
      nullable: true,
      minLength: 1
    },
    content: {
      type: "array",
      items: { type: "string" },
      nullable: true,
      minItems: 1
    }
  },
  anyOf: [
    { required: ["title"] },
    { required: ["content"] }
  ]
};

const ruleAlertSchema: JSONSchemaType<SigynAlert> = {
  type: "object",
  properties: {
    on: {
      type: "object",
      properties: {
        count: {
          oneOf: [
            { type: "number" },
            { type: "string" }
          ]
        },
        interval: { type: "string" }
      },
      required: ["count", "interval"],
      additionalProperties: false
    },
    template: {
      oneOf: [
        templateSchema,
        { type: "string", minLength: 1 }
      ]
    }
  },
  required: ["on", "template"]
};

export const CONFIG_SCHEMA: JSONSchemaType<SigynConfig> = {
  type: "object",
  properties: {
    loki: {
      type: "object",
      properties: {
        apiUrl: { type: "string", minLength: 1 }
      },
      required: ["apiUrl"]
    },
    templates: {
      type: "object",
      patternProperties: {
        "^.*$": templateSchema
      },
      nullable: true,
      additionalProperties: false,
      required: []
    },
    rules: {
      type: "array",
      uniqueItemProperties: ["name"],
      items: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 1 },
          logql: { type: "string", minLength: 1 },
          polling: {
            type: ["null", "string", "array"],
            oneOf: [
              { type: "string", minLength: 1 },
              { type: "array", items: { type: "string", minLength: 1 }, minItems: 1 }
            ],
            nullable: true
          },
          alert: ruleAlertSchema,
          disabled: { type: "boolean", nullable: true },
          notifiers: {
            type: "array",
            items: { type: "string" },
            nullable: true
          }
        },
        required: ["name", "logql", "alert"]
      }
    },
    notifiers: {
      type: "object",
      additionalProperties: true
    }
  },
  required: ["loki", "rules", "notifiers"],
  additionalProperties: false
};
