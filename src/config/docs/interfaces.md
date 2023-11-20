# Interfaces

```ts
interface SigynConfig {
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

interface SigynInitializedConfig {
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

interface PartialSigynConfig {
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

type ExtendedSigynConfig = Pick<SigynConfig, "templates" | "rules">;

interface LokiConfig {
  apiUrl: string;
}

interface SigynRule {
  name: string;
  logql: string | { query: string; vars?: Record<string, string | string[]> };
  polling: string | string[];
  pollingStrategy: "bounded" | "unbounded";
  alert: SigynAlert;
  disabled: boolean;
  notifiers: string[];
  labelFilters?: Record<string, string[]>;
}

interface SigynInitializedRule {
  name: string;
  logql: string;
  polling: string | string[];
  pollingStrategy: "bounded" | "unbounded";
  alert: SigynInitializedAlert;
  disabled: boolean;
  notifiers: string[];
  labelFilters?: Record<string, string[]>;
}

interface PartialSigynRule {
  name: string;
  logql: string | { query: string; vars?: Record<string, string | string[]> };
  polling?: string | string[];
  pollingStrategy?: "bounded" | "unbounded";
  alert: PartialSigynAlert;
  disabled?: boolean;
  notifiers?: string[];
  labelFilters?: Record<string, string[]>;
}

type NotifierFormattedSigynRule = Omit<SigynInitializedRule, "alert"> & {
  alert: Omit<SigynInitializedAlert, "template">
};

type AlertSeverity =
  "critical" |
  "error" | "major" |
  "warning" | "minor" |
  "information" | "info" | "low";

interface SigynAlert {
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

interface SigynInitializedAlert {
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

interface PartialSigynAlert {
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

interface SigynAlertTemplateExtendedContent {
  before?: string[];
  after?: string[];
}

interface SigynAlertTemplate {
  title?: string;
  content?: string[] | SigynAlertTemplateExtendedContent;
  extends?: string;
}

interface SigynInitializedTemplate {
  title?: string;
  content?: string[];
}

interface SigynSelfMonitoring {
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

interface SigynInitializedSelfMonitoring {
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

interface SigynCompositeRule {
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

interface SigynInitializedCompositeRule {
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
```
> [!NOTE]
> `SigynInitializedConfig` represents the config after initialization.
> For instance, given a rule with a `logql` object with `query` & `vars`, the rule is updated upon initialization then `logql` is always as **string**.

> [!NOTE]
> `PartialSigynConfig`, `PartialSigynRule` and `PartialSigynAlert` are the allowed types to **validate** config.
> These types have extra optional fields that are set by their default values upon initialization (`initConfig()`).
