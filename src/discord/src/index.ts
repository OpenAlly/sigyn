// Import Third-party Dependencies
import * as httpie from "@myunisoft/httpie";

// Import Internal Dependencies
import { ExecuteWebhookOptions, SigynRule } from "./types";

// CONSTANTS
const kWebhookUsername = "Sigyn Agent";

async function webhookStructure(counter: number, config: SigynRule) {
  // pupa is ESM only, need a dynamic import for CommonJS.
  const { default: pupa } = await import("pupa");

  const {
    alert: {
      on: {
        count, interval
      },
      template: {
        title: templateTitle = "",
        content: templateContent = []
      }
    },
    name: ruleName,
    polling,
    logql
  } = config;

  if (templateTitle === "" && templateContent.length === 0) {
    throw new Error("Invalid rule template: one of the title or content is required.");
  }

  const templateData = { ruleName, count, counter, interval, polling, logql };

  const content: string[] = templateContent.map((content) => pupa(
    content,
    templateData
  ));
  if (templateTitle) {
    content.unshift(pupa(templateTitle, templateData));
  }

  return {
    content: content.join("\n"),
    username: kWebhookUsername
  };
}

export async function executeWebhook(options: ExecuteWebhookOptions) {
  const { webhookUrl, counter, ruleConfig } = options;

  const body = await webhookStructure(counter, ruleConfig);

  return httpie.post<string>(webhookUrl, {
    body,
    headers: {
      "content-type": "application/json"
    }
  });
}
