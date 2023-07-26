export interface ExecuteWebhookOptions {
  webhookUrl: string;
  ruleConfig: SigynRule;
  counter: number;
}

export interface SigynRule {
  name: string;
  logql: string;
  polling: string | string[];
  alert: SigynAlert;
}

export interface SigynAlert {
  on: {
    count: number;
    interval: string;
  },
  template: SigynAlertTemplate;
}

export interface SigynAlertTemplate {
  title?: string;
  content?: string[];
}
