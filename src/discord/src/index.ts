// Import Third-party Dependencies
import * as httpie from "@myunisoft/httpie";
import { NotifierFormattedSigynRule } from "@sigyn/config";

// CONSTANTS
const kWebhookUsername = "Sigyn Agent";
// https://gist.github.com/thomasbnt/b6f455e2c7d743b796917fa3c205f812
const kEmbedColor = {
  critical: 15548997,
  error: 15105570,
  warning: 16776960,
  info: 16777215
};
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
  lokiUrl: string;
}

async function formatWebhook(options: ExecuteWebhookOptions) {
  const { counter, ruleConfig, label, severity, lokiUrl } = options;

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
    logql
  } = ruleConfig;

  if (templateTitle === "" && templateContent.length === 0) {
    throw new Error("Invalid rule template: one of the title or content is required.");
  }

  // displaying backtick in code snippet needs code snippet to be surround by double backtick.
  // if the logql ends with a backtick, we need to add a space after it otherwise the string
  // ends with triple backtick and the code snippet is done.
  const formattedLogQL = logql.includes("`") ? `\`\`${logql.endsWith("`") ? `${logql} ` : logql}\`\`` : `\`${logql}\``;
  const templateData = { ruleName, count, counter, interval, logql: formattedLogQL, label, lokiUrl };
  const contentTemplateOptions = {
    transform: ({ key, value }) => (key === "lokiUrl" ? value : `**${value === undefined ? "unknown" : value}**`),
    ignoreMissing: true
  };
  const titleTemplateOptions = {
    transform: ({ value }) => (value === undefined ? "unknown" : value),
    ignoreMissing: true
  };

  const content: string[] = templateContent.map((content) => pupa(
    content,
    templateData,
    contentTemplateOptions
  ));

  return {
    embeds: [{
      title: pupa(`${kSeverityEmoji[severity]} ${templateTitle}`, templateData, titleTemplateOptions),
      description: content.join("\n"),
      color: kEmbedColor[severity]
    }],
    username: kWebhookUsername
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
