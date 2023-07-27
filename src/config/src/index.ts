// Import Node.js Dependencies
import fs from "node:fs";

// Import Internal Dependencies
import { SigynConfig, SigynRule, SigynAlert, SigynAlertTemplate } from "./types";

export { SigynConfig, SigynRule, SigynAlert, SigynAlertTemplate };

let config: SigynConfig;

export function initConfig(path: fs.PathOrFileDescriptor): SigynConfig {
  const rawConfig = fs.readFileSync(path, "utf-8");

  config = JSON.parse(rawConfig);

  // TODO: verify configs format ?
  return config;
}

export function getConfig(): SigynConfig {
  if (config === undefined) {
    throw new Error("You must init config first");
  }

  return config;
}
