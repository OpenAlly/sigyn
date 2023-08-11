// Import Third-party Dependencies
import * as httpie from "@myunisoft/httpie";
import { AlertSeverity, NotifierFormattedSigynRule } from "@sigyn/config";

// CONSTANTS
const kWebhookUsername = "Sigyn Agent";
// https://gist.github.com/thomasbnt/b6f455e2c7d743b796917fa3c205f812
const kEmbedColor = {
  1: 15548997,
  2: 15105570,
  3: 16776960,
  4: 16777215
};
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
  const templateData = { ruleName, count, counter, interval, logql: formattedLogQL, label };
  const contentTemplateOptions = {
    transform: ({ value }) => (value === undefined ? value : `**${value}**`)
  };

  const content: string[] = templateContent.map((content) => pupa(
    content,
    templateData,
    contentTemplateOptions
  ));

  return {
    embeds: [{
      title: pupa(`${kSeverityEmoji[severity]} ${templateTitle}`, templateData),
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
