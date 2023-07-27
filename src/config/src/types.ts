export interface SigynConfig {
  notifiers: Record<string, unknown>;
  rules: SigynRule[]
}

export interface SigynRule {
  name: string;
  logql: string;
  polling: string;
  alert: SigynAlert;
  disabled?: boolean;
  notifiers?: string[];
}

export interface SigynAlert {
  on: {
    count: string | number;
    interval: string;
  },
  template: SigynAlertTemplate;
}

export interface SigynAlertTemplate {
  title?: string;
  content?: string[];
}
