# Composite Rules

Composite rules are based on rules and allow to send alert when a given set of rules triggers too much alert.

## Schema Properties

- `compositeRules` (Required, Array of Objects):
  - This property holds an array of composite rules.
  - Each composite rule object must have the following properties:

  | Property    | Type                   | Required | Description |
  |-------------|------------------------|----------|-------------|
  | `name`      | `string`               | ✔️       | The name of the rule. Must be unique between each rule. |
  | `notifiers` | `string []` | ✔️ | An array of strings representing the notifiers for the rule. It will enables all configured `notifiers` by default. |
  | `include` | `string[]` | ❌ | An array of strings representing the rule to  monitor. You can use glob syntax i.e `["PROD*"]` |
  | `exclude` | `string[]` | ❌ | An array of strings representing the rule to exclude from monitoring. You can use glob syntax i.e `["PROD*"]` |
  | `notifCount` | `number` | ✔️ | The minimum alerts to be sent from each watched rules |
  | `ruleCountThreshold` | `number` | ❌ | The minimum count of matching rules to triggers an alert to unlock composite rule. For instance, if you have 10 rules and `ruleCountThreshold` is 7, it means 7 rules must triggers an alert |
  | `interval`    | `string` | ❌ | A duration (i.e `1d`, `15m`) that represents the maximum interval date to count rules alerts |
  | `template`    | `object` | ✔️ | See [templates](./templates.md) |
  | `throttle`    | `object`   | ❌       | The maximum amount of alert in a given interval. |
  | `throttle.interval` | `string`   | ✔️       | The throttle duration (e.g. `1m`, `1h`) after sending an alert. |
  | `throttle.count`    | `number`   | ❌       | The count threshold to bypass throttle, default to `0` (never send alert before the end of interval). |
  | `throttle.activationThreshold`    | `number`   | ❌       | The number of alerts allowed to be sent before the throttle to be activated. |
  | `muteRules`  | `boolean` | ❌       | Weither matched rules should stop trigger alert when a higher-lever composite rule triggers. <br>Default `false`. |
  | `muteDuration`  | `string` | ❌       | Defines the duration for which rules should be muted.<br>Default `30m` |
