// Import Third-party Dependencies
import { ExecuteWebhookOptions, WebhookNotifier } from "@sigyn/notifiers";

class TeamsNotifier extends WebhookNotifier {
  contentTemplateOptions() {
    return {
      transform: ({ value, key }) => (key === "logql" || key === "lokiUrl" ? value : `**${value ?? "unknown"}**`),
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
      title,
      text: content.join("\n")
    };
  }

  #formatLogQL(logql: string): string {
    return `\`${logql.replaceAll("`", "'")}\``;
  }
}

export function execute(options: ExecuteWebhookOptions) {
  const notifier = new TeamsNotifier(options);

  return notifier.execute();
}
