// Import Third-party Dependencies
import { ExecuteWebhookOptions, WebhookNotifier } from "@sigyn/notifiers";

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

class DiscordNotifier extends WebhookNotifier {
  contentTemplateOptions() {
    return {
      transform: ({ key, value }) => (key === "lokiUrl" ? value : `**${value === undefined ? "unknown" : value}**`),
      ignoreMissing: true
    };
  }

  async formatWebhook(): Promise<any> {
    if (this.data.ruleConfig?.logql) {
      this.data.ruleConfig.logql = this.#formatLogQL(this.data.ruleConfig.logql);
    }

    const title = await this.formatTitle();
    const content = await this.formatContent();

    return {
      embeds: [{
        title,
        description: content.join("\n"),
        color: kEmbedColor[this.data.severity]
      }],
      username: kWebhookUsername,
      avatar_url: kAvatarUrl
    };
  }

  #formatLogQL(logql: string): string {
    return logql.includes("`") ? `\`\`${logql.endsWith("`") ? `${logql} ` : logql}\`\`` : `\`${logql}\``;
  }
}

export function execute(options: ExecuteWebhookOptions) {
  const notifier = new DiscordNotifier(options);

  return notifier.execute();
}
