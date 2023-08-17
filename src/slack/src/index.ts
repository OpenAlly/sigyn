// Import Third-party Dependencies
import * as httpie from "@myunisoft/httpie";
import { NotifierFormattedSigynRule } from "@sigyn/config";

// CONSTANTS
const kSeverityEmoji = {
  critical: "💥",
  error: "❗️",
  warning: "⚠️",
  info: "📢"
};

interface ExecuteWebhookOptions {
  webhookUrl: string;
  ruleConfig: NotifierFormattedSigynRule;
  counter: number;
  label: Record<string, string>;
  severity: "critical" | "error" | "warning" | "info";
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
    transform: ({ value, key }) => (key === "logql" ? value : `*${value ?? "unknown"}*`)
  };
  const titleTemplateOptions = {
    transform: ({ value }) => (value ?? "unknown"),
    ignoreMissing: true
  };

  const formattedContent: string[] = content.map((text) => pupa(
    text,
    templateData,
    templateOptions
  ));
  if (title) {
    formattedContent.unshift(pupa(formattedTitle, templateData, titleTemplateOptions));
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
