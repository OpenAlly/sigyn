// Import Third-party Dependencies
import { Ajv2020 as Ajv, type ErrorObject } from "ajv/dist/2020.js";
import _ajvKeywords from "ajv-keywords";

// Import Internal Dependencies
import type { ExtendedSigynConfig, PartialSigynConfig } from "./types.ts";
import rulesSchema from "./schemas/rules.json" with { type: "json" };
import templateSchema from "./schemas/templates.json" with { type: "json" };
import configSchema from "./schemas/configSchema.json" with { type: "json" };
import extendedConfigSchema from "./schemas/extendedConfigSchema.json" with { type: "json" };

// CONSTANTS
const kAjv = new Ajv();
kAjv.addSchema(rulesSchema);
kAjv.addSchema(templateSchema);
const ajvKeywords = _ajvKeywords as unknown as typeof _ajvKeywords.default;
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
    const rootTemplate = typeof rule.alert.template === "string" ? rule.alert.template : rule.alert.template.extends;

    if (rootTemplate === undefined) {
      continue;
    }

    const template = config.templates?.[rootTemplate];

    if (template === undefined) {
      throw new Error(`Template '${rootTemplate}' not found`);
    }
  }

  for (const rule of config.compositeRules ?? []) {
    const rootTemplate = typeof rule.template === "string" ? rule.template : rule.template.extends;

    if (rootTemplate === undefined) {
      continue;
    }

    const template = config.templates?.[rootTemplate];

    if (template === undefined) {
      throw new Error(`Template '${rootTemplate}' not found`);
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
  for (const rule of [...config.rules, ...(config.compositeRules ?? [])]) {
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
