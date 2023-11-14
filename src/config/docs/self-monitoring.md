# Self Monitoring

- `selfMonitoring` (Object, Optional):
  - Represents the configuration to enable self-monitoring.

  | Property    | Type                   | Required | Description |
  |-------------|------------------------|----------|-------------|
  | `template`  | `string` or `object` | ✔️ | See [templates](./templates.md) |
  | `notifiers` | `string []` | ✔️ | An array of strings representing the notifiers for the rule. It will enables all configured `notifiers` by default. |
  | `errorFilters` | `string[]` | ❌ | An array of strings representing the error to be filtered. Each value can be a strict-equal value or a RegExp. Examples of errors: `Bad Gateway`, `Bad Request` (if `rule.logql` is wrong), `Gateway Timeout`, etc |
  | `ruleFilters` | `string[]` | ❌ | An array of strings representing the rules to be filtered, **by their name**. Can be useful for instance if you have a rule with a very big potential count of logs that could often get a timeout |
  | `minimumErrorCount` | `number` | ❌ | The minimum of error before triggering an alert |
  | `throttle` | `object` | ❌ | See [Throttle](./throttle.md) |

> [!WARNING]
> Self-monitoring templates can be a root template reference, however the available variables are differents.
