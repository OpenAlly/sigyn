// Import Third-party Dependencies
import * as httpie from "@myunisoft/httpie";
import { NotifierFormattedSigynRule, SigynInitializedTemplate } from "@sigyn/config";

// CONSTANTS
const kAttachmentColor = {
  critical: "#FF3333",
  error: "#F3840F",
  warning: "#FFE333",
  info: "#E7E7E7"
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
  },
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

  // Slack doesn't support backtick escape in inline code
  function formatLogQL(logql: string) {
    return `\`${logql.replaceAll("`", "'")}\``;
  }
  // Slack doesn't support header format
  const formattedTitle = `${kSeverityEmoji[severity]} ${templateTitle}`;

  const templateData = {
    ...ruleConfig ?? {},
    agentFailure,
    counter,
    logql: ruleConfig?.logql ? formatLogQL(ruleConfig.logql) : null,
    label,
    lokiUrl,
    rules
  };
  const templateOptions = {
    transform: ({ value, key }) => {
      if (key === "logql" || key === "lokiUrl") {
        return value;
      }

      return `*${value ?? "unknown"}*`;
    }
  };
  const titleTemplateOptions = {
    transform: ({ value }) => (value ?? "unknown"),
    ignoreMissing: true
  };

  const body = {
    attachments: [
      {
        mrkdwn_in: ["text"],
        color: kAttachmentColor[severity],
        title: pupa(formattedTitle, templateData, titleTemplateOptions),
        fields: [
          {
            value: templateContent.map((text) => {
              if (text === "") {
                return "";
              }

              let formattedText = text;
              // Slack doesn't supports [label](url) format but <url|label> instead.
              const mdUrlRegex = /\[([^[\]]+)\]\(([^()]+)\)/g;
              const [url, label, link] = mdUrlRegex.exec(text) ?? [];
              if (url !== undefined) {
                formattedText = formattedText.replace(url, `<${link}|${label}>`);
              }

              return pupa(
                formattedText,
                templateData,
                templateOptions
              );
            }).join("\n").replaceAll(/>(?!\s|$)/g, "›"),
            short: false
          }
        ]
      }
    ]
  };

  return body;
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
