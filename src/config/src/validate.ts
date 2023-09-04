// Import Third-party Dependencies
import Ajv, { ErrorObject } from "ajv/dist/2020";
import ajvKeywords from "ajv-keywords";

// Import Internal Dependencies
import { ExtendedSigynConfig, PartialSigynConfig } from "./types";
import rulesSchema from "./schemas/rules.json";
import templateSchema from "./schemas/templates.json";
import configSchema from "./schemas/configSchema.json";
import extendedConfigSchema from "./schemas/extendedConfigSchema.json";

// CONSTANTS
const kAjv = new Ajv();
kAjv.addSchema(rulesSchema);
kAjv.addSchema(templateSchema);
ajvKeywords(kAjv);

export function validateConfig(config: PartialSigynConfig) {
  const validate = kAjv.compile(configSchema);

  if (!validate(config)) {
    throw new Error(`Invalid config: ${buildValidationErrorMessage(validate.errors!)}`);
  }

  validateTemplate(config);
}

export function validateExtendedConfig(config: ExtendedSigynConfig) {
  const validate = kAjv.compile(extendedConfigSchema);

  if (!validate(config)) {
    throw new Error(`Invalid extended config: ${buildValidationErrorMessage(validate.errors!)}`);
  }
}

function buildValidationErrorMessage(errors: ErrorObject[]) {
  return errors.map((err) => `${err.instancePath}: ${err.message}`).join(", ");
}

function validateTemplate(config: PartialSigynConfig) {
  for (const rule of config.rules) {
    if (typeof rule.alert.template === "string") {
      const template = config.templates?.[rule.alert.template];

      if (template === undefined) {
        throw new Error(`Template '${rule.alert.template}' not found`);
      }
    }
  }
}
