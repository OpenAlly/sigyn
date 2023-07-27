// Import Third-party Dependencies
import { JSONSchemaType } from "ajv";

// Import Internal Dependencies
import { SigynAlert, SigynConfig } from "./types";

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
    }
  },
  required: ["on", "template"]
};

export const CONFIG_SCHEMA: JSONSchemaType<SigynConfig> = {
  type: "object",
  properties: {
    rules: {
      type: "array",
      uniqueItemProperties: ["name"],
      items: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 1 },
          logql: { type: "string", minLength: 1 },
          polling: { type: "string", minLength: 1 },
          alert: ruleAlertSchema,
          disabled: { type: "boolean", nullable: true },
          notifiers: {
            type: "array",
            items: { type: "string" },
            nullable: true
          }
        },
        required: ["name", "logql", "polling", "alert"]
      }
    },
    notifiers: {
      type: "object",
      additionalProperties: true
    }
  },
  required: ["rules", "notifiers"],
  additionalProperties: false
};
