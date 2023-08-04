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

The **Sigyn** configuration object consists of theses properties: `loki`, `templates`, `rules` and `notifiers`.

### Required
The `loki` property defines an object that allows configuring Loki API access.

The `rules` property defines an array of rule objects, each representing a specific monitoring rule.

The `notifiers` property is an object that allows configuring various notification methods.

### Optional
The `templates` property defines an object that allows to reuse **template** in any rule.

The `extends` property defines an array of the configurations **paths** to extends from.
Theses configurations can have only `rules` and `templates` properties which works the same way as the main configuration.

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
  | `[key:string]` | `object` | ✔️       | A record of template object that can have either of `title` or `content` properties (**See below**) |

- `extends` (String[], Optional):
  - This array specifies the configuration paths to extends from.
  - The paths can be either `foo` or `foo.sigyn.config.json` where the `foo` configuration file **must** be `foo.sigyn.config.json`.

- `rules` (Required, Array of Objects):
  - This property holds an array of monitoring rules.
  - Each rule object must have the following properties:

  | Property    | Type                   | Required | Description |
  |-------------|------------------------|----------|-------------|
  | `name`      | `string`               | ✔️       | The name of the rule. Must be unique between each rule. |
  | `logql`     | `string`               | ✔️       | The LogQL query associated with the rule. |
  | `polling`   | `string` or `string[]` | ❌       | The polling interval for the rule. You can use a `duration` i.e. `2m` or a **Cron expression**. If given an array of polling, it should only be **Cron expressions**, this is usefull if you want a different polling the day and the night. Default to  `1m`. |
  | `alert`     | `object`               | ✔️       | An object defining the alerting configuration for the rule. |
  | `disabled`  | `boolean`              | ❌       | Weither the rule is enabled, default to `false`. |
  | `notifiers` | `string[]`             | ❌       | An array of strings representing the notifiers for the rule. It will enables all configured `notifiers` by default. |

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

  | Property   | Type                 | Required | Description |
  |------------|----------------------|----------|-------------|
  | `count`    | `number` or `string` | ✔️       | The count threshold of log that must triggers an alert. You can use a range string i.e. `<= 5`, `> 6`. |
  | `interval` | `string`             | ✔️       | The time interval for the alerting condition. |

- `rules.alert.template` (Object or String, Required):
  - CAn be an object representing the notification template or a string refering to a root template.
  - It can have either of the following properties:

  | Property   | Type       | Required | Description |
  |------------|------------|----------|-------------|
  | `title`    | `string`   | ❌       | The title of the notification template. |
  | `content`  | `string[]` | ❌       | The content of the notification template. |

> **Note** At least one of `title` or `content` must be provided.

**Notifiers**

**Sigyn** provide its set of notifiers, each one have its own configuration rules.

- `@sigyn/discord` [See docs](../discord/README.md)
- `@sigyn/slack` [See docs](../slack/README.md)
- `@sigyn/teams` [See docs](../teams/README.md)

> **Note** You can also use your own notifier and use any third-party notifier [more info](./TODO/)

You can use any of theses variables, surrounding with `{}` (see example below):
- `ruleName`
- `logql`
- `counter`
- `counter`
- `interval`

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

> **Note** You **MUST NOT** use markdown in `title` or `content`, this is handled by notifiers.

### Example configuration

```json
{
  "loki": {
    "apiUrl": "http://localhost:3100"
  },
  "templates": {
    "onlyTitle": {
      "title": "🚨 {ruleName} - Triggered {counter} times!"
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
          "title": "🚨 {ruleName} - Triggered {counter} times!",
          "content": [
            "- LogQL: {logql}",
            "- Threshold: {count}",
            "- Interval: {interval}"
          ]
        }
      }
    },
    {
      "name": "test2",
      "logql": "{app=\"foo\", env=\"preprod\"} |= `your awesome logql`",
      "polling": "30s",
      "alert": {
        "on": {
          "count": "< 10",
          "interval": "5m"
        },
        "template": "onlyTitle"
      }
    }
  ]
}
```

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

### `initConfig(path: fs.PathOrFileDescriptor): SigynConfig`

Initialize **Sigyn** config given the path to the JSON config file.

### `getConfig(): SigynConfig`

Returns the previously initialized **Sigyn** config.

> **Note** If you try to get config while the config has not been initialied, it will throws.

### `validateConfig(config: SigynConfig): void`

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
}

type ExtendedSigynConfig = Pick<SigynConfig, "templates" | "rules">;

interface LokiConfig {
  apiUrl: string;
}

interface SigynRule {
  name: string;
  logql: string;
  polling?: string | string[];
  alert: SigynAlert;
  disabled?: boolean;
  notifiers?: string[];
}

type NotifierFormattedSigynRule = Omit<SigynRule, "alert"> & {
  alert: Omit<SigynAlert, "template"> & { template: SigynAlertTemplate };
}

interface SigynAlert {
  on: {
    count: string | number;
    interval: string;
  },
  template: string | SigynAlertTemplate;
}

interface SigynAlertTemplate {
  title?: string;
  content?: string[];
}
```

## License
MIT
