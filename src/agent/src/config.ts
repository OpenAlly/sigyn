// Import Node.js Dependencies
import path from "node:path";
import fs from "node:fs";

export interface SigynConfig {
  notifiers: SigynNotifiers;
  rules: SigynRule[]
}

export interface SigynNotifiers {
  discord?: DiscordNotifier;
  slack?: SlackNotifier;
}

export interface DiscordNotifier {
  webhookUrl: string;
}

export interface SlackNotifier {
  webhookUrl: string;
}

export interface SigynRule {
  name: string;
  logql: string;
  polling: string;
  alert: SigynAlert;
  disabled?: boolean;
  notifiers?: (keyof SigynNotifiers)[];
}

export interface SigynAlert {
  on: {
    count: number;
    interval: string;
  },
  template: SigynAlertTemplate;
}

export interface SigynAlertTemplate {
  title?: string;
  content?: string[];
}

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
