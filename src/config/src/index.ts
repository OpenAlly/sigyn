// Import Node.js Dependencies
import fs from "node:fs";
import path from "node:path";

// Import Internal Dependencies
import { type SigynInitializedConfig } from "./types.ts";
import { validateConfig, validateExtendedConfig } from "./validate.ts";
import * as utils from "./utils/index.ts";

export * from "./types.ts";
export { validateConfig, validateExtendedConfig };

let initializedConfig: SigynInitializedConfig;

export async function initConfig(configPath: string | URL): Promise<SigynInitializedConfig> {
  const rawConfig = fs.readFileSync(configPath, "utf-8");

  const config: SigynInitializedConfig = JSON.parse(rawConfig);

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

  for (const [key, template] of Object.entries(config.templates ?? {})) {
    config.templates![key] = utils.extendsTemplates(template, config);
  }

  const rules = await utils.rules.initialize(config);
  validateConfig(config);

  config.rules = utils.rules.applyLogQLVariables({ ...config, rules });

  const compositeRules = utils.compositeRules.initialize(config);

  initializedConfig = utils.applyDefaultValues({
    ...config,
    compositeRules: utils.compositeRules.handleTemplates(config, compositeRules)
  });

  return initializedConfig;
}

export function getConfig(): SigynInitializedConfig {
  if (initializedConfig === undefined) {
    throw new Error("You must init config first");
  }

  return initializedConfig;
}

