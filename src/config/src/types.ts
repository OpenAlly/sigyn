export interface SigynConfig {
  loki: LokiConfig;
  notifiers: Record<string, unknown>;
  rules: SigynRule[]
}

export interface LokiConfig {
  apiUrl: string;
}

export interface SigynRule {
  name: string;
  logql: string;
  polling: string | string[];
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
