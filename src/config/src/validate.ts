// Import Third-party Dependencies
import Ajv, { ErrorObject } from "ajv/dist/2020.js";
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
  validateNotifiers(config);
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
    const templateMustExists = typeof rule.alert.template === "string" ? rule.alert.template : rule.alert.template.extends;

    if (templateMustExists === undefined) {
      continue;
    }

    const template = config.templates?.[templateMustExists];

    if (template === undefined) {
      throw new Error(`Template '${templateMustExists}' not found`);
    }
  }

  for (const template of Object.values(config.templates ?? {})) {
    if (template.extends === undefined) {
      continue;
    }

    const configTemplate = config.templates?.[template.extends];

    if (configTemplate === undefined) {
      throw new Error(`Template '${template.extends}' not found`);
    }
  }
}

function validateNotifiers(config: PartialSigynConfig) {
  for (const rule of config.rules) {
    if (!rule.notifiers) {
      continue;
    }

    for (const notifier of rule.notifiers) {
      if (config.notifiers[notifier] === undefined) {
        throw new Error(`Notifier '${notifier}' not found`);
      }
    }
  }

  if (config.selfMonitoring?.notifiers) {
    for (const notifier of config.selfMonitoring.notifiers) {
      if (config.notifiers[notifier] === undefined) {
        throw new Error(`Notifier '${notifier}' not found`);
      }
    }
  }
}
