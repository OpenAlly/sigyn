// Import Third-party Dependencies
import { AlertSeverity, getConfig } from "@sigyn/config";

// CONSTANTS
const kDefaultSeverity = "error";

export function getSeverity(sev: undefined | AlertSeverity): "critical" | "error" | "warning" | "info" {
  const { defaultSeverity = kDefaultSeverity } = getConfig();

  switch (sev) {
    case "critical":
      return sev;
    case "error":
    case "major":
      return "error";
    case "warning":
    case "minor":
      return "warning";
    case "information":
    case "info":
    case "low":
      return "info";
    default:
      return getSeverity(defaultSeverity);
  }
}
