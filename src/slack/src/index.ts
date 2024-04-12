// Import Third-party Dependencies
import { WebhookNotifierOptions, WebhookNotifier } from "@sigyn/notifiers";
import { MessageAttachment } from "@slack/types";

// CONSTANTS
const kAttachmentColor = {
  critical: "#FF3333",
  error: "#F3840F",
  warning: "#FFE333",
  info: "#E7E7E7"
};

export interface SlackWebhookBodyFormat {
  attachments?: MessageAttachment[];
}

class SlackNotifier extends WebhookNotifier<SlackWebhookBodyFormat> {
  contentTemplateOptions() {
    return {
      transform: ({ value, key }) => {
        if (key === "logql" || key === "lokiUrl") {
          return value;
        }

        return `*${value ?? "unknown"}*`;
      },
      ignoreMissing: true
    };
  }

  async formatWebhookBody(): Promise<SlackWebhookBodyFormat> {
    if (this.data.ruleConfig?.logql) {
      this.data.ruleConfig.logql = this.#formatLogQL(this.data.ruleConfig.logql);
    }

    this.template.content = this.template.content.map((text) => {
      let formattedText = text;
      // Slack doesn't supports [label](url) format but <url|label> instead.
      const mdUrlRegex = /\[([^[\]]+)\]\(([^()]+)\)/g;
      const [url, label, link] = mdUrlRegex.exec(text) ?? [];
      if (url !== undefined) {
        formattedText = formattedText.replace(url, `<${link}|${label}>`);
      }

      return formattedText;
    });

    const [title, content] = await Promise.all([
      this.formatTitle(),
      this.formatContent()
    ]);

    return {
      attachments: [
        {
          mrkdwn_in: ["text"],
          color: kAttachmentColor[this.data.severity],
          title,
          fields: [
            {
              title,
              value: content.join("\n").replaceAll(/>(?!\s|$)/g, "›"),
              short: false
            }
          ]
        }
      ]
    };
  }

  #formatLogQL(logql: string): string {
    return `\`${logql.replaceAll("`", "'")}\``;
  }
}

export async function execute(
  options: WebhookNotifierOptions
) {
  const notifier = new SlackNotifier(options);
  const body = await notifier.formatWebhookBody();

  return notifier.execute(
    body
  );
}
