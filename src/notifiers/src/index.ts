// Import Third-party Dependencies
import { NotifierFormattedSigynRule, SigynInitializedTemplate } from "@sigyn/config";

// Import Internal Dependencies
import { WebhookNotifier } from "./webhook";

export { WebhookNotifier };

export interface ExecuteWebhookOptions {
  webhookUrl: string;
  data: ExecuteWebhookData;
  template: SigynInitializedTemplate;
}

export interface ExecuteWebhookData {
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
}

