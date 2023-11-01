// Import Third-party Dependencies
import { ExecuteWebhookOptions, WebhookNotifier } from "@sigyn/notifiers";

// CONSTANTS
const kAttachmentColor = {
  critical: "#FF3333",
  error: "#F3840F",
  warning: "#FFE333",
  info: "#E7E7E7"
};

class SlackNotifier extends WebhookNotifier {
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

  async formatWebhook(): Promise<any> {
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

    const title = await this.formatTitle();
    const content = await this.formatContent();

    return {
      attachments: [
        {
          mrkdwn_in: ["text"],
          color: kAttachmentColor[this.data.severity],
          title,
          fields: [
            {
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

export function execute(options: ExecuteWebhookOptions) {
  const notifier = new SlackNotifier(options);

  return notifier.execute();
}
