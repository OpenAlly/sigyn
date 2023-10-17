export interface SigynConfig {
  loki: LokiConfig;
  notifiers: Record<string, {
    notifier: string;
    [key: string]: unknown;
  }>;
  rules: SigynRule[];
  templates?: Record<string, SigynAlertTemplate>;
  extends?: string[];
  missingLabelStrategy: "ignore" | "error";
  defaultSeverity: AlertSeverity;
  selfMonitoring?: SigynSelfMonitoring;
  compositeRules?: SigynCompositeRule[];
}

export interface SigynInitializedConfig {
  loki: LokiConfig;
  notifiers: Record<string, {
    notifier: string;
    [key: string]: unknown;
  }>;
  rules: SigynInitializedRule[];
  templates?: Record<string, SigynInitializedTemplate>;
  extends?: string[];
  missingLabelStrategy: "ignore" | "error";
  defaultSeverity: AlertSeverity;
  selfMonitoring?: SigynInitializedSelfMonitoring;
  compositeRules?: SigynInitializedCompositeRule[];
}

export interface PartialSigynConfig {
  loki: LokiConfig;
  notifiers: Record<string, {
    notifier: string;
    [key: string]: unknown;
  }>;
  rules: PartialSigynRule[];
  templates?: Record<string, SigynAlertTemplate>;
  extends?: string[];
  missingLabelStrategy?: "ignore" | "error";
  defaultSeverity?: AlertSeverity;
  selfMonitoring?: SigynSelfMonitoring;
  compositeRules?: SigynCompositeRule[];
}

export type ExtendedSigynConfig = Pick<SigynConfig, "templates" | "rules">;

export interface LokiConfig {
  apiUrl: string;
}

export interface SigynRule {
  name: string;
  logql: string | { query: string; vars?: Record<string, string | string[]> };
  polling: string | string[];
  pollingStrategy: "bounded" | "unbounded";
  alert: SigynAlert;
  disabled: boolean;
  notifiers: string[];
  labelFilters?: Record<string, string[]>;
}

export interface SigynInitializedRule {
  name: string;
  logql: string;
  polling: string | string[];
  pollingStrategy: "bounded" | "unbounded";
  alert: SigynInitializedAlert;
  disabled: boolean;
  notifiers: string[];
  labelFilters?: Record<string, string[]>;
}

export interface PartialSigynRule {
  name: string;
  logql: string | { query: string; vars?: Record<string, string | string[]> };
  polling?: string | string[];
  pollingStrategy?: "bounded" | "unbounded";
  alert: PartialSigynAlert;
  disabled?: boolean;
  notifiers?: string[];
  labelFilters?: Record<string, string[]>;
}

export type NotifierFormattedSigynRule = Omit<SigynInitializedRule, "alert"> & {
  alert: Omit<SigynInitializedAlert, "template">
};

export type AlertSeverity =
  "critical" |
  "error" | "major" |
  "warning" | "minor" |
  "information" | "info" | "low";

export interface SigynAlert {
  on: {
    count?: string | number;
    interval?: string;
    label?: string;
    value?: string;
    valueMatch?: string;
    percentThreshold?: number;
    minimumLabelCount?: number;
  },
  template: string | SigynAlertTemplate;
  severity: Extract<AlertSeverity, "critical" | "error" | "warning" | "information">;
  throttle?: {
    count: number;
    interval: string;
    activationThreshold?: number;
    labelScope?: string[];
  };
}

export interface SigynInitializedAlert {
  on: {
    count?: string | number;
    interval?: string;
    label?: string;
    value?: string;
    valueMatch?: string;
    percentThreshold?: number;
    minimumLabelCount?: number;
  },
  template: SigynInitializedTemplate;
  severity: Extract<AlertSeverity, "critical" | "error" | "warning" | "information">;
  throttle?: {
    count: number;
    interval: string;
    activationThreshold: number;
    labelScope: string[];
  };
}

export interface PartialSigynAlert {
  on: {
    count?: string | number;
    interval?: string;
    label?: string;
    value?: string;
    valueMatch?: string;
    percentThreshold?: number;
    minimumLabelCount?: number;
  },
  template: string | SigynAlertTemplate;
  severity?: AlertSeverity;
  throttle?: {
    count?: number;
    interval: string;
    activationThreshold?: number;
    labelScope?: string[];
  };
}

export interface SigynAlertTemplateExtendedContent {
  before?: string[];
  after?: string[];
}

export interface SigynAlertTemplate {
  title?: string;
  content?: string[] | SigynAlertTemplateExtendedContent;
  extends?: string;
}

export interface SigynInitializedTemplate {
  title?: string;
  content?: string[];
}

export interface SigynSelfMonitoring {
  template: string | SigynInitializedTemplate;
  notifiers: string[];
  errorFilters?: string[];
  ruleFilters?: string[];
  minimumErrorCount?: number;
  throttle?: {
    count?: number;
    interval: string;
    activationThreshold?: number;
  };
}

export interface SigynInitializedSelfMonitoring {
  template: SigynInitializedTemplate;
  notifiers: string[];
  errorFilters?: string[];
  ruleFilters?: string[];
  minimumErrorCount?: number;
  throttle?: {
    count: number;
    interval: string;
    activationThreshold: number;
  };
}

export interface SigynCompositeRule {
  name: string;
  include?: string[];
  exclude?: string[];
  notifCount: number;
  ruleCountThreshold?: number;
  interval?: string;
  template: string | SigynAlertTemplate;
  notifiers?: string[];
  throttle?: {
    count?: number;
    interval: string;
    activationThreshold?: number;
  };
}

export interface SigynInitializedCompositeRule {
  name: string;
  rules: string[];
  notifCount: number;
  ruleCountThreshold?: number;
  interval: string;
  template: string | SigynInitializedTemplate;
  notifiers: string[];
  throttle?: {
    count: number;
    interval: string;
    activationThreshold: number;
  };
}
