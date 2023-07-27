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
        title = "",
        content = []
      }
    },
    name: ruleName,
    logql
  } = config;

  if (title === "" && content.length === 0) {
    throw new Error("Invalid rule template: one of the title or content is required.");
  }

  // Slack doesn't support backtick escape in inline code
  const formattedLogQL = `\`${logql.replaceAll("`", "'")}\``;
  // Slack doesn't support header format
  const formattedTitle = `*${title}*\n\n`;

  const templateData = { ruleName, count, counter, interval, logql: formattedLogQL };
  const templateOptions = {
    transform: ({ value, key }) => (value === undefined || key === "logql" ? value : `*${value}*`)
  };

  const formattedContent: string[] = content.map((text) => pupa(
    text,
    templateData,
    templateOptions
  ));
  if (title) {
    formattedContent.unshift(pupa(formattedTitle, templateData));
  }

  return {
    text: formattedContent.join("\n")
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
