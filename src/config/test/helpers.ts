// Import Internal Dependencies
import { AlertSeverity, PartialSigynConfig } from "../src/types";

export const VALID_CONFIG: PartialSigynConfig = {
  loki: {
    apiUrl: "http://localhost:3100"
  },
  notifiers: {
    discord: {
      notifier: "discord",
      bar: "baz"
    }
  },
  rules: [
    {
      name: "test1",
      logql: "{app=\"foo\", env=\"prod\"} |= `One of the file names does not match what is expected`",
      polling: "1m",
      alert: {
        on: {
          count: 6,
          interval: "5m"
        },
        template: {
          title: "🚨 {ruleName} - Triggered {counter} times!",
          content: [
            "- LogQL: {logql}",
            "- Threshold: {count}",
            "- Interval: {interval}"
          ]
        }
      },
      labelFilters: {
        env: ["prod", "preprod"]
      }
    }
  ]
};

export const VALID_ALERT_SEVERITIES: AlertSeverity[] = [
  "critical",
  "error", "major",
  "warning", "minor",
  "information", "info", "low"
];
