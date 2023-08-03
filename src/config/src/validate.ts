// Import Third-party Dependencies
import Ajv, { ErrorObject } from "ajv";
import ajvKeywords from "ajv-keywords";

// Import Internal Dependencies
import { SigynConfig } from "./types";
import configSchema from "./schema.json";

// CONSTANTS
const kAjv = new Ajv();
ajvKeywords(kAjv);

export function validate(config: SigynConfig) {
  const validate = kAjv.compile(configSchema);

  if (!validate(config)) {
    throw new Error(`Invalid config: ${buildValidationErrorMessage(validate.errors!)}`);
  }

  validateTemplate(config);
}

function buildValidationErrorMessage(errors: ErrorObject[]) {
  return errors.map((err) => `${err.instancePath}: ${err.message}`).join(", ");
}

function validateTemplate(config: SigynConfig) {
  for (const rule of config.rules) {
    if (typeof rule.alert.template === "string") {
      const template = config.templates?.[rule.alert.template];

      if (template === undefined) {
        throw new Error(`Template '${rule.alert.template}' not found`);
      }
    }
  }
}
