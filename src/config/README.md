<p align="center"><h1 align="center">
  Config
</h1></p>

<p align="center">
  Sigyn configuration manager
</p>

<p align="center">
  <a href="https://github.com/MyUnisoft/sigyn/src/config">
    <img src="https://img.shields.io/github/package-json/v/MyUnisoft/sigyn/main/src/config?style=for-the-badge&label=version" alt="npm version">
  </a>
  <a href="https://github.com/MyUnisoft/sigyn/src/config">
    <img src="https://img.shields.io/bundlephobia/min/@sigyn/config?style=for-the-badge" alt="size">
  </a>
    <img src="https://api.securityscorecards.dev/projects/github.com/MyUnisoft/sigyn/badge?style=for-the-badge" alt="ossf scorecard">
  </a>
  <a href="https://github.com/MyUnisoft/sigyn/tree/main/src/config">
    <img src="https://img.shields.io/github/actions/workflow/status/MyUnisoft/sigyn/config.yml?style=for-the-badge">
  </a>
  <a href="https://github.com/MyUnisoft/sigyn/tree/main/src/LICENSE">
    <img src="https://img.shields.io/github/license/MyUnisoft/sigyn?style=for-the-badge" alt="license">
  </a>
</p>

## ⚙️ Configuration

The **Sigyn** configuration object consists of theses properties: `loki`, `templates`, `rules`,  `notifiers` and `selfMonitoring`.

### Example configuration

```json
{
  "loki": {
    "apiUrl": "http://localhost:3100"
  },
  "templates": {
    "onlyTitle": {
      "title": "{ruleName} - Triggered {counter} times!"
    }
  }
  "notifiers": {
    "slack": {
      "webhookUrl": "https://hooks.slack.com/services/aaa/bbb"
    },
    "discord": {
      "webhookUrl": "https://discord.com/api/webhooks/aaa/bbb"
    },
    "teams": {
      "webhookUrl": "https://bizoffice9447.webhook.office.com/webhookb2/aaa/bbb"
    }
  },
  "rules": [
    {
      "name": "test1",
      "logql": "{app=\"foo\", env=\"preprod\"} |= `your awesome logql`",
      "polling": [
        "*/10 * 0-15 * * *",
        "*/30 * 16-23 * * *"
      ],
      "alert": {
        "on": {
          "count": "10",
          "interval": "5m"
        },
        "template": {
          "title": "{ruleName} - Triggered {counter} times!",
          "content": [
            "- LogQL: {logql}",
            "- Threshold: {count}",
            "- Interval: {interval}",
            "- [See logs on Grafana]({lokiUrl})"
          ]
        }
      }
    },
    {
      "name": "My rule on env: {label.env}",
      "logql": "{app=\"foo\", env={label.env}} |= `your awesome logql`",
      "polling": "30s",
      "labelFilters": {
        "env": ["prod", "preprod"]
      },
      "alert": {
        "on": {
          "count": "< 10",
          "interval": "5m"
        },
        "template": "onlyTitle"
      }
    },
    {
      "name": "A rule based on label matching",
      "logql": "{app=\"foo\"} |~ `state: (ok|ko)` | regexp `state: (?P<state>ok|ko)`",
      "alert": {
        "on": {
          "label": "state",
          "value": "ko",
          "percentThreshold": 80,
          "interval": "5d"
        },
        "template": {
          "title": "Too much KO"
        }
      }
    }
  ]
}
```

### Required
The `loki` property defines an object that allows configuring Loki API access.

The `rules` property defines an array of rule objects, each representing a specific monitoring rule.

The `notifiers` property is an object that allows configuring various notification methods.

### Optional
The `templates` property defines an object that allows to reuse **template** in any rule.

The `extends` property defines an array of the configurations **paths** to extends from.
Theses configurations can have only `rules` and `templates` properties which works the same way as the main configuration.

The `missingLabelStrategy` defines the behavior when **Sigyn** detects an unknown label value. 
- `ignore` Default. Skip the rule creation for the given label.
- `error` Fails config validation (Sigyn agent will not start).

The `defaultSeverity` defines the rule alert severities when not specified. Severity 3 (`error`) by default.<br>
**Allowed values:**
- `critical`
- `error` | `major`
- `warning` | `minor`
- `information` | `info` | `low`

The `selfMonitoring` property defines how/when Sigyn should emit alert for self problem (i.e when Loki API is down)

### Schema Properties

- `loki` (Object, Required):
  - This object specifies the Loki API configuration.

  | Property   | Type       | Required | Description |
  |------------|------------|----------|-------------|
  | `apiUrl`   | `string`   | ✔️       | The Loki API url |

- `templates` (Object, Optional):
  - This object specifies templates to be used in the `rules`.

  | Property       | Type     | Required | Description |
  |----------------|----------|----------|-------------|
  | `[key:string]` | `object` | ✔️       | A record of template object that can have either of `title`, `content` or `extends` properties (**See below**) |

- `extends` (String[], Optional):
  - This array specifies the configuration paths to extends from.
  - The paths can be either `foo` or `foo.sigyn.config.json` where the `foo` configuration file **must** be `foo.sigyn.config.json`.

- `missingLabelStrategy` (String, Optional):
  - This property defines whether Sigyn should throw if a given label value is not found via Loki API.

  | Value    | Description |
  |----------|-------------|
  | `ignore` | (**Default**) Skip the rule creation for each unknown label |
  | `error`  | Invalidate config and throws when an unknown label is given |

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

- `rules.logql` (Object, Required):
 - This object specifies rule LogQL options
 - You can either use this object pattern **or** a simple string.

 | Property    | Type                                   | Required | Description |
 |-------------|----------------------------------------|----------|-------------|
 | `query`     | `string`                               | ✔️       | The LogQL query e.g. `{app="foo"} |= "error"` |
 | `vars`      | `Record<string, string | string[]>`    | ✔️       | A record of vars that you can use in the `query` with `{vars.yourVar}` syntax |

- `rules.alert` (Object, Required):
  - This object specifies the alerting configuration for the rule.
  - It must have the following properties:

  | Property   | Type     | Required | Description |
  |------------|----------|----------|-------------|
  | `on`       | `object` | ✔️       | An object specifying when the alert should trigger. |
  | `template` | `object` or `string` | ✔️       | An object or a string representing the notification template. |

- `rules.alert.on` (Object, Required):
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

- `rules.alert.template` (Object or String, Required):
  - Can be an object representing the notification template or a string refering to a root template.
  - It can have either of the following properties:

  | Property   | Type       | Required | Description |
  |------------|------------|----------|-------------|
  | `title`    | `string`   | ❌       | The title of the notification template. |
  | `content`  | `string[]` or `object` | ❌       | The content of the notification template. It can be an object when extending another template |
  | `content.before`  | `string[]` | ❌       | The content of the notification template to add **after** the extended template's content |
  | `content.after`  | `string[]` | ❌       | The content of the notification template to add **before** the extended template's content |
  | `extends`  | `string` | ❌       | The content of the notification template. |

  > [!NOTE]
  > At least one of `title` or `content` must be provided.

  > [!NOTE]
  > When extending template with `extends`:
  > - if `title` is specified then it replaces the extended template's title
  > - if `content` is `string[]` then it has the same behavior as using `content.after` i.e. it adds the content **after** the extended template's content.

  > [!NOTE]
  > Extending templates can be nested

- `rules.alert.severity` (String or Number, Optional):
  - If not specified, the default value is `config.defaultSeverity`, if not specified the default is Severity 3 (`error`). Theses severities change the alert UI sent by the notifiers.
  **Allowed values:**
  - `critical`
  - `error` | `major`
  - `warning` | `minor`
  - `information` | `info` | `low`

- `rules.alert.throttle` (Object, Optional):
  - Can be an object representing the maximum amount of alert in a given interval.
  - It must have the following properties:

  | Property   | Type       | Required | Description |
  |------------|------------|----------|-------------|
  | `interval` | `string`   | ✔️       | The throttle duration (e.g. `1m`, `1h`) after sending an alert. |
  | `count`    | `number`   | ❌       | The count threshold to bypass throttle, default to `0` (never send alert before the end of interval). |

- `selfMonitoring` (Object, Optional):
  - Represents the configuration to enable self-monitoring.

  | Property    | Type                   | Required | Description |
  |-------------|------------------------|----------|-------------|
  | `template`  | `string` or `object` | ✔️ | The notifiers template, works same as `rules.alert.template` |
  | `notifiers` | `string []` | ✔️ | An array of strings representing the notifiers for the rule. It will enables all configured `notifiers` by default. |
  | `errorFilters` | `string[]` | ❌ | An array of strings representing the error to be filtered. Each value can be a strict-equal value or a RegExp. Examples of errors: `Bad Gateway`, `Bad Request` (if `rule.logql` is wrong), `Gateway Timeout`, etc |
  | `ruleFilters` | `string[]` | ❌ | An array of strings representing the rules to be filtered, **by their name**. Can be useful for instance if you have a rule with a very big potential count of logs that could often get a timeout |
  | `minimumErrorCount` | `number` | ❌ | The minimum of error before triggering an alert |
  | `throttle.interval` | `string` | ✔️ | The throttle duration (e.g. `1m`, `1h`) after sending an alert. |
  | `throttle.count`    | `number` | ❌ | The count threshold to bypass throttle, default to `0` (never send alert before the end of interval). |

> [!WARNING]
> Self-monitoring templates can be a root template reference, however the available variables are differents.

- `rule.labelFilters` (Object, Optional):
  - This object specifies label filters to add for a given rule.
  - Each key represents a label

  | Property       | Type       | Required | Description |
  |----------------|------------|----------|-------------|
  | `[key:string]` | `string[]` | ✔️       | A list of label values |

**Notifiers**

**Sigyn** provide its set of notifiers, each one have its own configuration rules.

- `@sigyn/discord` [See docs](../discord/README.md)
- `@sigyn/slack` [See docs](../slack/README.md)
- `@sigyn/teams` [See docs](../teams/README.md)

> [!NOTE]
> You can also use your own notifier and use any third-party notifier [more info](./TODO/)

You can use any of theses variables, surrounding with `{}` (see example below):
- `ruleName`
- `logql`
- `counter`
- `counter`
- `interval`
- `lokiUrl` 

> [!NOTE]
> You can use hyperlink with Markdown i.e. `[See logs]({lokiUrl})`

For self-monitoring, you can use theses variables, surrounding with `{}`:
- `agentFailure.errors` which is equal to the joined error messages
- `agentFailure.rules` which is equal to the joined failed rules

You can also use a label variable from your LogQL using `{label.x}`:
```json
{
  ...
  "logql": "{app=\"foo\", env=\"preprod\"} |= `my super logql`",
  "template": {
    "content": [
      "app: {label.app} | env: {label.env}"
    ]
  }
  ...
}
```

You can also use any variable extracted from `stream` vector.

> [!NOTE]
> You **MUST NOT** use markdown in `title` or `content`, this is handled by notifiers.

## 🧠 Visual Studio Code JSON schema

You can easily enjoy autocompletion & documentation from JSON schema for your `sigyn.config.json` on Visual Studio Code.

1. Go in settings. <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd> -> **Preferences: Open User Settings (JSON)**
2. Add the JSON Schemas:
```json
"json.schemas": [
  {
    "fileMatch": ["*.sigyn.config.json"],
    "url":  "https://raw.githubusercontent.com/MyUnisoft/sigyn/main/src/config/src/schemas/extendedConfigSchema.json"
  },
  {
    "fileMatch": ["sigyn.config.json"],
    "url":  "https://raw.githubusercontent.com/MyUnisoft/sigyn/main/src/config/src/schemas/configSchema.json"
  }
]
```

## 🌐 API

### `initConfig(path: string | URL): Promise<SigynConfig>`

Initialize **Sigyn** config given the path to the JSON config file.

### `getConfig(): SigynConfig`

Returns the previously initialized **Sigyn** config.

> [!NOTE]
> If you try to get config while the config has not been initialied, it will throws.

### `validateConfig(config: PartialSigynConfig): void`

Validate Sigyn configuration against an internal AJV Schema.

### `validateExtendedConfig(config: ExtendedSigynConfig): void`

Validate Sigyn extended configuration against an internal AJV Schema.

## 🖋️ Interfaces

```ts
interface SigynConfig {
  loki: LokiConfig;
  notifiers: Record<string, unknown>;
  rules: SigynRule[];
  templates?: Record<string, SigynAlertTemplate>;
  extends?: string[];
  missingLabelStrategy: "ignore" | "error";
  defaultSeverity: AlertSeverity
}

interface SigynInitializedConfig {
  loki: LokiConfig;
  notifiers: Record<string, unknown>;
  rules: SigynInitializedRule[];
  templates?: Record<string, SigynInitializedTemplate>;
  extends?: string[];
  missingLabelStrategy: "ignore" | "error";
  defaultSeverity: AlertSeverity
}

interface PartialSigynConfig {
  loki: LokiConfig;
  notifiers: Record<string, unknown>;
  rules: PartialSigynRule[];
  templates?: Record<string, SigynAlertTemplate>;
  extends?: string[];
  missingLabelStrategy?: "ignore" | "error";
  defaultSeverity?: AlertSeverity
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
  alert: Omit<SigynInitializedAlert, "template"> & {
    template: SigynInitializedTemplate;
  };
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
  template: string | SigynInitializedTemplate;
  severity: Extract<AlertSeverity, "critical" | "error" | "warning" | "information">;
  throttle?: {
    count: number;
    interval: string;
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
```
> [!NOTE]
> `SigynInitializedConfig` represents the config after initialization.
> For instance, given a rule with a `logql` object with `query` & `vars`, the rule is updated upon initialization then `logql` is always as **string**.

> [!NOTE]
> `PartialSigynConfig`, `PartialSigynRule` and `PartialSigynAlert` are the allowed types to **validate** config.
> These types have extra optional fields that are set by their default values upon initialization (`initConfig()`).

## License
MIT
