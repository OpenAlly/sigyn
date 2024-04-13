// Import Third-party Dependencies
import {
  SigynInitializedTemplate,
  NotifierFormattedSigynRule
} from "@sigyn/config";
import { morphix } from "@sigyn/morphix";
import * as httpie from "@myunisoft/httpie";

// CONSTANTS
const kSeverityEmoji = {
  critical: "💥",
  error: "❗️",
  warning: "⚠️",
  info: "📢"
};

export interface WebhookNotifierOptions {
  webhookUrl: string;
  data: WebhookData;
  template: SigynInitializedTemplate;
}

export interface WebhookData {
  ruleConfig?: NotifierFormattedSigynRule;
  counter?: number;
  severity: "critical" | "error" | "warning" | "info";
  label?: Record<string, string>;
  lokiUrl?: string;
  agentFailure?: {
    errors: string;
    rules: string;
  }
  rules?: string;
  labelCount: number;
  labelMatchCount: number;
  labelMatchPercent?: number;
}

export class WebhookNotifier<T> {
  webhookUrl: string;
  data: WebhookData;
  template: SigynInitializedTemplate;
  showSeverityEmoji = true;

  #headers: httpie.RequestOptions["headers"];
  #defaultTemplateOptions = {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    transform: ({ value, key }) => (value === undefined ? "unknown" : value),
    ignoreMissing: true
  };

  constructor(options: WebhookNotifierOptions) {
    this.webhookUrl = options.webhookUrl;
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

  formatTitle(): Promise<string> {
    if (this.data.ruleConfig) {
      this.data = {
        ...this.data,
        ...this.data.ruleConfig
      };
    }

    if (this.showSeverityEmoji && this.template.title) {
      const emoji = kSeverityEmoji[this.data.severity];
      this.template.title = `${emoji} ${this.template.title}`;
    }

    return morphix(this.template.title, this.data, this.titleTemplateOptions());
  }

  async formatContent(): Promise<string[]> {
    /**
     * We update the data here at the end of lifecycle
     * in case the user update data / ruleConfig previous in the lifecycle
     */
    if (this.data.ruleConfig) {
      this.data = {
        ...this.data,
        ...this.data.ruleConfig
      };
    }

    return Promise.all(
      this.template.content.map((content) => morphix(content, this.data, this.contentTemplateOptions()))
    );
  }

  async execute(
    body: T
  ): Promise<httpie.RequestResponse<string>> {
    return httpie.post<string>(this.webhookUrl, {
      body,
      headers: this.#headers
    });
  }
}
