// Import Third-party Dependencies
import * as httpie from "@myunisoft/httpie";
import { NotifierFormattedSigynRule, SigynInitializedTemplate } from "@sigyn/config";
import { morphix } from "@sigyn/morphix";

// CONSTANTS
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
  },
  rules?: string;
}

async function formatWebhook(options: ExecuteWebhookOptions) {
  const { agentFailure, counter, ruleConfig, label, severity, lokiUrl, rules } = options.data;

  const { title: templateTitle = "", content: templateContent = [] } = options.template;
  if (templateTitle === "" && templateContent.length === 0) {
    throw new Error("Invalid rule template: one of the title or content is required.");
  }

  function formatLogQL(logql: string) {
    return `\`${logql.replaceAll("`", "'")}\``;
  }

  const templateData = {
    ...ruleConfig ?? {},
    agentFailure,
    counter,
    logql: ruleConfig?.logql ? formatLogQL(ruleConfig.logql) : null,
    label,
    lokiUrl,
    rules
  };
  const textTemplateOptions = {
    transform: ({ value, key }) => (key === "logql" || key === "lokiUrl" ? value : `**${value ?? "unknown"}**`)
  };
  const titleTemplateOptions = {
    transform: ({ value }) => value ?? "unknown",
    ignoreMissing: true
  };

  const content: string[] = await Promise.all(templateContent.map(async(content) => await morphix(
    content,
    templateData,
    textTemplateOptions
  )));

  return {
    title: await morphix(`${kSeverityEmoji[severity]} ${templateTitle}`, templateData, titleTemplateOptions),
    text: content.join("\n")
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
