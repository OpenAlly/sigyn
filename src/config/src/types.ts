export interface SigynConfig {
  loki: LokiConfig;
  notifiers: Record<string, unknown>;
  rules: SigynRule[];
  templates?: Record<string, SigynAlertTemplate>;
  extends?: string[];
}

export type ExtendedSigynConfig = Pick<SigynConfig, "templates" | "rules">;

export interface LokiConfig {
  apiUrl: string;
}

export interface SigynRule {
  name: string;
  logql: string;
  polling?: string | string[];
  alert: SigynAlert;
  disabled?: boolean;
  notifiers?: string[];
  labelFilters?: Record<string, string[]>;
}

export type NotifierFormattedSigynRule = Omit<SigynRule, "alert"> & {
  alert: Omit<SigynAlert, "template"> & { template: SigynAlertTemplate };
}

export interface SigynAlert {
  on: {
    count: string | number;
    interval: string;
  },
  template: string | SigynAlertTemplate;
}

export interface SigynAlertTemplate {
  title?: string;
  content?: string[];
}
