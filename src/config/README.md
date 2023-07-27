<p align="center"><h1 align="center">
  Config
</h1></p>

<p align="center">
  Sigyn configuration manager
</p>

<p align="center">
  <a href="https://github.com/MyUnisoft/sigyn/src/config">
    <img src="https://img.shields.io/github/package-json/v/sigyn/config?style=for-the-badge" alt="npm version">
  </a>
   <a href="https://github.com/MyUnisoft/sigyn/tree/main/src/config">
    <img src="https://img.shields.io/npm/dw/@sigyn/discord?style=for-the-badge" alt="download">
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

The **Sigyn** configuration object consists of two main properties: `rules` and `notifiers`. The `rules` property defines an array of rule objects, each representing a specific monitoring rule.
The `notifiers` property is an object that allows configuring various notification methods.

### Schema Properties

1. `rules` (Required, Array of Objects):
   - This property holds an array of monitoring rules.
   - Each rule object must have the following properties:

   | Property    | Type                   | Required | Description |
   |-------------|------------------------|----------|-------------|
   | `name`      | `string`               | ✔️       | The name of the rule. Must be unique between each rule. |
   | `logql`     | `string`               | ✔️       | The LogQL query associated with the rule. |
   | `polling`   | `string` or `string[]` | ✔️       | The polling interval for the rule. You can use a `duration` i.e. `2m` or a **Cron expression**. If given an array of polling, it should only be **Cron expressions**, this is usefull if you want a different polling the day and the night. |
   | `alert`     | `object`               | ✔️       | An object defining the alerting configuration for the rule. |
   | `disabled`  | `boolean`              | ❌       | Weither the rule is enabled, default to `false`. |
   | `notifiers` | `string[]`             | ❌       | An array of strings representing the notifiers for the rule. |

2. `alert` (Object, Required):
   - This object specifies the alerting configuration for the rule.
   - It must have the following properties:

   | Property   | Type     | Required | Description |
   |------------|----------|----------|-------------|
   | `on`       | `object` | ✔️       | An object specifying when the alert should trigger. |
   | `template` | `object` | ✔️       | An object representing the notification template. |

3. `on` (Object, Required):
   - An object specifying when the alert should trigger.
   - It must have the following properties:

   | Property   | Type                 | Required | Description |
   |------------|----------------------|----------|-------------|
   | `count`    | `number` or `string` | ✔️       | The count threshold of log that must triggers an alert. You can use a range string i.e. `<= 5`, `> 6`. |
   | `interval` | `string`             | ✔️       | The time interval for the alerting condition. |

4. `template` (Object, Required):
   - An object representing the notification template.
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

> **Note** You **MUST NOT** use markdown in `title` or `content`, this is handled by notifiers.

### Example configuration

```json
{
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
    }
  ]
}
```

## 🌐 API

### `initConfig(path: fs.PathOrFileDescriptor): SigynConfig`

Initialize **Sigyn** config given the path to the JSON config file.

### `getConfig(): SigynConfig`

Returns the previously initialized **Sigyn** config.

> **Note** If you try to get config while the config has not been initialied, it will throws.

## 🖋️ Interfaces

```ts
interface SigynConfig {
  notifiers: Record<string, unknown>;
  rules: SigynRule[]
}

interface SigynRule {
  name: string;
  logql: string;
  polling: string;
  alert: SigynAlert;
  disabled?: boolean;
  notifiers?: string[];
}

interface SigynAlert {
  on: {
    count: number;
    interval: string;
  },
  template: SigynAlertTemplate;
}

interface SigynAlertTemplate {
  title?: string;
  content?: string[];
}
```

## License
MIT
