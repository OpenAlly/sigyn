// Import Third-party Dependencies
import Ajv, { ErrorObject } from "ajv";
import ajvKeywords from "ajv-keywords";

// Import Internal Dependencies
import { SigynConfig } from "./types";
import { CONFIG_SCHEMA } from "./schema";

// CONSTANTS
const kAjv = new Ajv();
ajvKeywords(kAjv);

export function validate(config: SigynConfig) {
  const validate = kAjv.compile(CONFIG_SCHEMA);

  if (!validate(config)) {
    throw new Error(`Invalid config: ${buildValidationErrorMessage(validate.errors!)}`);
  }
}

function buildValidationErrorMessage(errors: ErrorObject[]) {
  return errors.map((err) => `${err.instancePath}: ${err.message}`).join(", ");
}
