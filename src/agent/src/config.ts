// Import Node.js Dependencies
import path from "node:path";
import fs from "node:fs";

// Import Internal Dependencies
import { SigynConfig } from "./types";

let config: SigynConfig;

export function initConfig(location: string): SigynConfig {
  const rawConfig = fs.readFileSync(path.join(location, "/config.json"), "utf-8");

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
