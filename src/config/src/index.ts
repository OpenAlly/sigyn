// Import Node.js Dependencies
import fs from "node:fs";

// Import Internal Dependencies
import { SigynConfig, LokiConfig, SigynRule, SigynAlert, SigynAlertTemplate } from "./types";
import { validate } from "./validate";

export { SigynConfig, LokiConfig, SigynRule, SigynAlert, SigynAlertTemplate };

let config: SigynConfig;

export function initConfig(path: fs.PathOrFileDescriptor): SigynConfig {
  const rawConfig = fs.readFileSync(path, "utf-8");

  config = JSON.parse(rawConfig);

  validate(config);

  return config;
}

export function getConfig(): SigynConfig {
  if (config === undefined) {
    throw new Error("You must init config first");
  }

  return config;
}
