// Import Internal Dependencies
import { ExecuteWebhookData, ExecuteWebhookOptions } from ".";

// Import Third-party Dependencies
import { SigynInitializedTemplate } from "@sigyn/config";
import { morphix } from "@sigyn/morphix";
import * as httpie from "@myunisoft/httpie";

// CONSTANTS
const kSeverityEmoji = {
  critical: "💥",
  error: "❗️",
  warning: "⚠️",
  info: "📢"
};

export class WebhookNotifier {
  webhookUrl: string;
  data: ExecuteWebhookData;
  template: SigynInitializedTemplate;
  showSeverityEmoji = true;

  #headers: httpie.RequestOptions["headers"];
  #defaultTemplateOptions = {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    transform: ({ value, key }) => (value === undefined ? "unknown" : value),
    ignoreMissing: true
  };

  constructor(options: ExecuteWebhookOptions) {
    this.webhookUrl = JSON.parse(JSON.stringify((options.webhookUrl)));
    this.data = JSON.parse(JSON.stringify((options.data)));
    this.template = JSON.parse(JSON.stringify((options.template)));

    this.#headers = {
      "content-type": "application/json"
    };
  }

  contentTemplateOptions() {
    return this.#defaultTemplateOptions;
  }

  titleTemplateOptions() {
    return this.#defaultTemplateOptions;
  }

  async formatTitle() {
    if (this.data.ruleConfig) {
      this.data = {
        ...this.data,
        ...this.data.ruleConfig
      };
    }

    if (this.showSeverityEmoji && this.template.title) {
      this.template.title = `${kSeverityEmoji[this.data.severity]} ${this.template.title}`;
    }

    return await morphix(this.template.title, this.data, this.titleTemplateOptions());
  }

  async formatContent() {
    // We update the data here at the end of lifecycle in case the user update data / ruleConfig previous in the lifecycle
    if (this.data.ruleConfig) {
      this.data = {
        ...this.data,
        ...this.data.ruleConfig
      };
    }

    const contents: string[] = [];

    for (const content of this.template.content) {
      contents.push(await morphix(content, this.data, this.contentTemplateOptions()));
    }

    return contents;
  }

  async formatWebhook() {
    throw new Error("formatWebhook method must be implemented");
  }

  async execute() {
    const body = await this.formatWebhook();

    return httpie.post<string>(this.webhookUrl, {
      body,
      headers: this.#headers
    });
  }
}
