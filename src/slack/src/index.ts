// Import Third-party Dependencies
import * as httpie from "@myunisoft/httpie";
import { NotifierFormattedSigynRule } from "@sigyn/config";

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
  const formattedTitle = `${kSeverityEmoji[severity]} ${title}`;

  const templateData = { ruleName, count, counter, interval, logql: formattedLogQL, label, lokiUrl };
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
            value: content.map((text) => {
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
            }).join("\n").replaceAll(/>(?!\s)/g, "›"),
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
