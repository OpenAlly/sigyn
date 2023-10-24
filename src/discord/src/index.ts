// Import Third-party Dependencies
import * as httpie from "@myunisoft/httpie";
import { NotifierFormattedSigynRule, SigynInitializedTemplate } from "@sigyn/config";

// CONSTANTS
const kWebhookUsername = "Sigyn Agent";
const kAvatarUrl = "https://user-images.githubusercontent.com/39910767/261796970-1c07ee01-30e4-464c-b9f9-903b93f84ff3.png";
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
  data: ExecuteWebhookData;
  template: SigynInitializedTemplate;
}

interface ExecuteWebhookData {
  ruleConfig?: NotifierFormattedSigynRule;
  counter?: number;
  severity: "critical" | "error" | "warning" | "info";
  label?: Record<string, string>;
  lokiUrl?: string;
  agentFailure?: {
    errors: string;
    rules: string;
  }
  rules?: string;
}

async function formatWebhook(options: ExecuteWebhookOptions) {
  const { agentFailure, counter, ruleConfig, label, severity, lokiUrl, rules } = options.data;
  // pupa is ESM only, need a dynamic import for CommonJS.
  const { default: pupa } = await import("pupa");

  const { title: templateTitle = "", content: templateContent = [] } = options.template;
  if (templateTitle === "" && templateContent.length === 0) {
    throw new Error("Invalid rule template: one of the title or content is required.");
  }

  // displaying backtick in code snippet needs code snippet to be surround by double backtick.
  // if the logql ends with a backtick, we need to add a space after it otherwise the string
  // ends with triple backtick and the code snippet is done.
  function formatLogQL(logql: string) {
    return logql.includes("`") ? `\`\`${logql.endsWith("`") ? `${logql} ` : logql}\`\`` : `\`${logql}\``;
  }

  const templateData = {
    ...ruleConfig ?? {},
    ruleName: ruleConfig?.name,
    agentFailure,
    counter,
    logql: ruleConfig?.logql ? formatLogQL(ruleConfig.logql) : null,
    label,
    lokiUrl,
    rules
  };

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
    username: kWebhookUsername,
    avatar_url: kAvatarUrl
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
