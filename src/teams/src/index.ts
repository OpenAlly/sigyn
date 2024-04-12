// Import Third-party Dependencies
import { WebhookNotifierOptions, WebhookNotifier } from "@sigyn/notifiers";

export interface TeamsWebhookBodyFormat {
  title: string,
  text: string
}

class TeamsNotifier extends WebhookNotifier<TeamsWebhookBodyFormat> {
  contentTemplateOptions() {
    return {
      transform: ({ value, key }) => (key === "logql" || key === "lokiUrl" ? value : `**${value ?? "unknown"}**`),
      ignoreMissing: true
    };
  }

  async formatWebhookBody(): Promise<TeamsWebhookBodyFormat> {
    if (this.data.ruleConfig?.logql) {
      this.data.ruleConfig.logql = this.#formatLogQL(this.data.ruleConfig.logql);
    }

    const [title, content] = await Promise.all([
      this.formatTitle(),
      this.formatContent()
    ]);

    return {
      title,
      text: content.join("\n")
    };
  }

  #formatLogQL(logql: string): string {
    return `\`${logql.replaceAll("`", "'")}\``;
  }
}

export async function execute(
  options: WebhookNotifierOptions
) {
  const notifier = new TeamsNotifier(options);
  const body = await notifier.formatWebhookBody();

  return notifier.execute(
    body
  );
}
