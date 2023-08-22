// Import Node.js Dependencies
import fs from "node:fs";
import path from "node:path";

// Import Internal Dependencies
import { SigynConfig } from "./types";
import { validateConfig, validateExtendedConfig } from "./validate";
import * as utils from "./utils";

export * from "./types";
export { validateConfig, validateExtendedConfig };

let config: SigynConfig;

export async function initConfig(configPath: string | URL): Promise<SigynConfig> {
  const rawConfig = fs.readFileSync(configPath, "utf-8");

  config = JSON.parse(rawConfig);

  if (config.extends) {
    for (const extendedConfigPath of config.extends) {
      const formattedPath = extendedConfigPath.endsWith(".json") ? extendedConfigPath : `${extendedConfigPath}.sigyn.config.json`;
      const rawConfig = fs.readFileSync(path.join(configPath.toString(), "..", formattedPath), "utf-8");
      const extendConfig = JSON.parse(rawConfig);

      validateExtendedConfig(extendConfig);

      if (extendConfig.templates) {
        config.templates = {
          ...config.templates,
          ...extendConfig.templates
        };
      }

      config.rules.push(...extendConfig.rules);
    }
  }

  config.rules = await utils.mergeRulesLabelFilters(config);
  validateConfig(config);

  return utils.applyDefaultValues(config);
}

export function getConfig(): SigynConfig {
  if (config === undefined) {
    throw new Error("You must init config first");
  }

  return config;
}

