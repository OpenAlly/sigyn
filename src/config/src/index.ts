// Import Node.js Dependencies
import fs from "node:fs";
import path from "node:path";

// Import Internal Dependencies
import { SigynInitializedConfig } from "./types";
import { validateConfig, validateExtendedConfig } from "./validate";
import * as utils from "./utils";

export * from "./types";
export { validateConfig, validateExtendedConfig };

let config: SigynInitializedConfig;

export async function initConfig(configPath: string | URL): Promise<SigynInitializedConfig> {
  const rawConfig = fs.readFileSync(configPath, "utf-8");

  const conf: SigynInitializedConfig = JSON.parse(rawConfig);

  if (conf.extends) {
    for (const extendedConfigPath of conf.extends) {
      const formattedPath = extendedConfigPath.endsWith(".json") ? extendedConfigPath : `${extendedConfigPath}.sigyn.config.json`;
      const rawConfig = fs.readFileSync(path.join(configPath.toString(), "..", formattedPath), "utf-8");
      const extendConfig = JSON.parse(rawConfig);

      validateExtendedConfig(extendConfig);

      if (extendConfig.templates) {
        conf.templates = {
          ...conf.templates,
          ...extendConfig.templates
        };
      }

      conf.rules.push(...extendConfig.rules);
    }
  }

  for (const [key, template] of Object.entries(conf.templates ?? {})) {
    conf.templates![key] = utils.extendsTemplates(template, conf);
  }

  const rules = await utils.initializeRules(conf);
  validateConfig(conf);

  conf.rules = utils.applyRulesLogQLVariables({ ...conf, rules });

  config = utils.applyDefaultValues(conf);

  return config;
}

export function getConfig(): SigynInitializedConfig {
  if (config === undefined) {
    throw new Error("You must init config first");
  }

  return config;
}

