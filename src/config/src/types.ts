export interface SigynConfig {
  loki: LokiConfig;
  notifiers: Record<string, unknown>;
  rules: SigynRule[];
  templates?: Record<string, SigynAlertTemplate>;
  extends?: string[];
  missingLabelStrategy?: "ignore" | "error";
  defaultSeverity?: AlertSeverity
}

export type ExtendedSigynConfig = Pick<SigynConfig, "templates" | "rules">;

export interface LokiConfig {
  apiUrl: string;
}

export interface SigynRule {
  name: string;
  logql: string;
  polling?: string | string[];
  pollingStrategy?: "bounded" | "unbounded";
  alert: SigynAlert;
  disabled?: boolean;
  notifiers?: string[];
  labelFilters?: Record<string, string[]>;
}

export type NotifierFormattedSigynRule = Omit<SigynRule, "alert"> & {
  alert: Omit<SigynAlert, "template"> & { template: SigynAlertTemplate };
}

export type AlertSeverity =
  "critical" |
  "error" | "major" |
  "warning" | "minor" |
  "information" | "info" | "low";

export interface SigynAlert {
  on: {
    count: string | number;
    interval: string;
  },
  template: string | SigynAlertTemplate;
  severity?: AlertSeverity;
  throttle?: {
    count?: number;
    interval: string;
  };
}

export interface SigynAlertTemplate {
  title?: string;
  content?: string[];
}
