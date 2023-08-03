// Import Third-party Dependencies
import * as httpie from "@myunisoft/httpie";
import { NotifierFormattedSigynRule } from "@sigyn/config";

interface ExecuteWebhookOptions {
  webhookUrl: string;
  ruleConfig: NotifierFormattedSigynRule;
  counter: number;
  label: Record<string, string>;
}

async function formatWebhook(counter: number, config: NotifierFormattedSigynRule, label?: Record<string, string>) {
  // pupa is ESM only, need a dynamic import for CommonJS.
  const { default: pupa } = await import("pupa");

  const {
    alert: {
      on: {
        count, interval
      },
      template: {
        title = "",
        content: templateContent = []
      }
    },
    name: ruleName,
    logql
  } = config;

  if (title === "" && templateContent.length === 0) {
    throw new Error("Invalid rule template: one of the title or content is required.");
  }

  const formattedLogQL = `\`${logql.replaceAll("`", "'")}\``;
  const templateData = { ruleName, count, counter, interval, logql: formattedLogQL, label };
  const textTemplateOptions = {
    transform: ({ value, key }) => (value === undefined || key === "logql" ? value : `**${value}**`)
  };

  const content: string[] = templateContent.map((content) => pupa(
    content,
    templateData,
    textTemplateOptions
  ));

  return {
    title: pupa(title, templateData),
    text: content.join("\n")
  };
}

export async function execute(options: ExecuteWebhookOptions) {
  const { webhookUrl, counter, ruleConfig, label } = options;

  const body = await formatWebhook(counter, ruleConfig, label);

  return httpie.post<string>(webhookUrl, {
    body,
    headers: {
      "content-type": "application/json"
    }
  });
}
