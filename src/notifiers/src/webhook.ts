// Import Third-party Dependencies
import type {
  SigynInitializedTemplate,
  NotifierFormattedSigynRule
} from "@sigyn/config";
import { morphix, type MorphixOptions } from "@sigyn/morphix";
import * as httpie from "@myunisoft/httpie";

// CONSTANTS
const kSeverityEmoji = {
  critical: "💥",
  error: "❗️",
  warning: "⚠️",
  info: "📢"
};
const kDefaultTemplateOptions: MorphixOptions = {
  transform: ({ value }) => (value === undefined ? "unknown" : value),
  ignoreMissing: true
};

export interface WebhookNotifierOptions {
  webhookUrl: string;
  data: WebhookData;
  template: SigynInitializedTemplate;
  /**
   * @default true
   */
  showSeverityEmoji?: boolean;
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
  };
  rules?: string;
  labelCount: number;
  labelMatchCount: number;
  labelMatchPercent?: number;
}

export class WebhookNotifier<T> {
  webhookUrl: string;
  data: WebhookData;
  template: SigynInitializedTemplate;
  showSeverityEmoji: boolean;

  constructor(
    options: WebhookNotifierOptions
  ) {
    const { webhookUrl, data, template, showSeverityEmoji = true } = options;

    this.webhookUrl = webhookUrl;
    this.data = JSON.parse(JSON.stringify((data)));
    this.template = JSON.parse(JSON.stringify((template)));
    this.showSeverityEmoji = showSeverityEmoji;
  }

  contentTemplateOptions(): MorphixOptions {
    return kDefaultTemplateOptions;
  }

  titleTemplateOptions(): MorphixOptions {
    return kDefaultTemplateOptions;
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
      headers: {
        "content-type": "application/json"
      }
    });
  }
}
