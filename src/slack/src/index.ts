// Import Third-party Dependencies
import * as httpie from "@myunisoft/httpie";
import { AlertSeverity, NotifierFormattedSigynRule } from "@sigyn/config";

// CONSTANTS
const kSeverityEmoji = {
  1: "💥",
  2: "❗️",
  3: "⚠️",
  4: "📢"
};

interface ExecuteWebhookOptions {
  webhookUrl: string;
  ruleConfig: NotifierFormattedSigynRule;
  counter: number;
  label?: Record<string, string>;
  severity: Extract<AlertSeverity, 1 | 2 | 3 | 4>;
}

async function formatWebhook(options: ExecuteWebhookOptions) {
  const { counter, ruleConfig, label, severity } = options;

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
  } = ruleConfig;

  if (title === "" && content.length === 0) {
    throw new Error("Invalid rule template: one of the title or content is required.");
  }

  // Slack doesn't support backtick escape in inline code
  const formattedLogQL = `\`${logql.replaceAll("`", "'")}\``;
  // Slack doesn't support header format
  const formattedTitle = `*${kSeverityEmoji[severity]} ${title}*\n\n`;

  const templateData = { ruleName, count, counter, interval, logql: formattedLogQL, label };
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
  const body = await formatWebhook(options);

  return httpie.post<string>(options.webhookUrl, {
    body,
    headers: {
      "content-type": "application/json"
    }
  });
}
