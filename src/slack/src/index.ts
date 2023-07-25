// Import Third-party Dependencies
import * as httpie from "@myunisoft/httpie";

// Import Internal Dependencies
import { ExecuteWebhookOptions, SigynRule } from "./types";

async function formatWebhook(counter: number, config: SigynRule) {
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

  // Slack doesn't support backtick escape in inline code
  const formattedLogQL = `\`${logql.replaceAll("`", "'")}\``;
  // Slack doesn't support header format
  const escapedTitle = templateTitle.startsWith("#") ? templateTitle.replace(/^#*/, "").trimStart() : templateTitle;
  const formattedTitle = `${escapedTitle.startsWith("*") ? escapedTitle : `*${escapedTitle}*`}\n\n`;

  const templateData = { ruleName, count, counter, interval, polling, logql: formattedLogQL };

  const content: string[] = templateContent.map((content) => pupa(
    content.replaceAll("**", "*"),
    templateData
  ));
  if (templateTitle) {
    content.unshift(pupa(formattedTitle.replaceAll("**", "*"), templateData));
  }

  return {
    text: content.join("\n")
  };
}

export async function execute(options: ExecuteWebhookOptions) {
  const { webhookUrl, counter, ruleConfig } = options;

  const body = await formatWebhook(counter, ruleConfig);

  return httpie.post<string>(webhookUrl, {
    body,
    headers: {
      "content-type": "application/json"
    }
  });
}
