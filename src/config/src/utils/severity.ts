// Import Internal Dependencies
import type { AlertSeverity } from "../types.js";

export function getSeverity(sev: AlertSeverity): "critical" | "error" | "warning" | "info" {
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
      throw new Error(`Invalid severity: ${sev}`);
  }
}
