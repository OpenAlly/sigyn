# Rules

Rules represents the main field of the Sigyn configuration. Theses allow to detailing when alerts should trigger based on specified conditions.

## Schema Properties
- `rules` (Required, Array of Objects):
  - This property holds an array of monitoring rules.
  - Each rule object must have the following properties:

  | Property    | Type                   | Required | Description |
  |-------------|------------------------|----------|-------------|
  | `name`      | `string`               | ✔️       | The name of the rule. Must be unique between each rule. |
  | `logql`     | `string` **or**  `object` | ✔️    | The LogQL query associated with the rule. You can use `{label.x}` where `x` is provided in `labelFilters` (see example below) |
  | `polling`   | `string` or `string[]` | ❌       | The polling interval for the rule. You can use a `duration` i.e. `2m` or a **Cron expression**. If given an array of polling, it should only be **Cron expressions**, this is useful if you want a different polling the day and the night. Default to  `1m`. |
  | `pollingStrategy` | `bounded` or `unbounded` | ❌ | **For CRON polling only**. Defines how Sigyn should fetch logs given a range. For instance, given `* 7-20 * * *` at `7:00` it will fetch logs since `20:59` last day with `unbounded` strategy. It will skip and wait the next poll given a `bounded` strategy. Default to `unbounded`
  | `alert`     | `object`               | ✔️       | An object defining the alerting configuration for the rule. |
  | `disabled`  | `boolean`              | ❌       | Weither the rule is enabled, default to `false`. |
  | `notifiers` | `string[]`             | ❌       | An array of strings representing the notifiers for the rule. It will enables all configured `notifiers` by default. |

- `logql` (Object, Required):
 - This object specifies rule LogQL options
 - You can either use this object pattern **or** a simple string.

 | Property    | Type                                   | Required | Description |
 |-------------|----------------------------------------|----------|-------------|
 | `query`     | `string`                               | ✔️       | The LogQL query e.g. `{app="foo"} |= "error"` |
 | `vars`      | `Record<string, string | string[]>`    | ✔️       | A record of vars that you can use in the `query` with `{vars.yourVar}` syntax |

- `alert` (Object, Required):
  - This object specifies the alerting configuration for the rule.
  - It must have the following properties:

  | Property   | Type     | Required | Description |
  |------------|----------|----------|-------------|
  | `on`       | `object` | ✔️       | An object specifying when the alert should trigger. |
  | `template` | `object` or `string` | ✔️       | An object or a string representing the notification template. |

- `alert.on` (Object, Required):
  - An object specifying when the alert should trigger.
  - It must have the following properties:

  | Property            | Type                 | Description |
  |---------------------|----------------------|-------------|
  | `count`             | `number` or `string` | The count threshold of log or label that must triggers an alert. You can use a range string i.e. `<= 5`, `> 6`. For **label based** alert, this property **MUST** be a valid number i.e `900` or `"900"` |
  | `interval`          | `string`             | The time interval for the alerting condition. |
  | `label`             | `string`             | The label key to check. |
  | `value`             | `string`             | The label value to check. |
  | `valueMatch`        | `string`             | The label regexp to check. |
  | `percentThreshold`  | `number`             | The percent threshold of label value. |
  | `minimumLabelCount` | `number`             | The minimum count of label to compare percent threshold. |

  > [!NOTE]
  > There are 2 sorts of alert: **basic** and **label based**  
  > For **basic** alert, both `count` and `interval` are **required**, other properties **must** be omitted.  
  > For **label based** alert, `label`, `value` **or** `valueMatch` are **required** plus at least one of `minimumLabelCount` or `interval` which defines the minimum logs to be fetched to have a revelant alert when `percentThreshold` is set, or `count` which works the same as basic alerting.  
  > `minimumLabelCount` and/or `interval` are optional when rule is based on `count` label.  
  > You cannot use both `value` and `valueMatch`

- `alert.template` See [templates](./templates.md)

- `alert.severity` (String or Number, Optional):
  - If not specified, the default value is `config.defaultSeverity`, if not specified the default is Severity 3 (`error`). Theses severities change the alert UI sent by the notifiers.
  **Allowed values:**
  - `critical`
  - `error` | `major`
  - `warning` | `minor`
  - `information` | `info` | `low`

- `alert.throttle` (Object, Optional):
  - Can be an object representing the maximum amount of alert in a given interval.
  - It must have the following properties:

  | Property   | Type       | Required | Description |
  |------------|------------|----------|-------------|
  | `interval` | `string`   | ✔️       | The throttle duration (e.g. `1m`, `1h`) after sending an alert. |
  | `count`    | `number`   | ❌       | The count threshold to bypass throttle, default to `0` (never send alert before the end of interval). |
  | `activationThreshold`    | `number`   | ❌       | The number of alerts allowed to be sent before the throttle to be activated. |
  | `labelScope`    | `string[]`   | ❌       | Allow for the implementation of a dedicated throttle mechanism per label value. For example, when the labelScope is `["app"]`, if an alert is triggered by logs from the 'foo' app, then subsequently, if new logs come from the 'bar' app, a second alert will also be triggered, resulting in a total of two alerts where both app have its own throttle. |

- `labelFilters` (Object, Optional):
  - This object specifies label filters to add for a given rule.
  - Each key represents a label

  | Property       | Type       | Required | Description |
  |----------------|------------|----------|-------------|
  | `[key:string]` | `string[]` | ✔️       | A list of label values |
