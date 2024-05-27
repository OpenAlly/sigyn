# Composite Rules

Composite rules are based on rules and allow to send alert when a given set of rules triggers too much alert for a given interval.

Composite rules takes an array of object in the `compositeRules` root config field.

## Summary

- [Example Configuration](#example-configuration)
- [Schema Properties](#schema-properties)
  - [`name`](#name)
  - [`notifiers`](#notifiers)
  - [`include`](#include)
  - [`exclude`](#exclude)
  - [`notifCount`](#notifcount)
  - [`ruleCountThreshold`](#rulecountthreshold)
  - [`interval`](#interval)
  - [`template`](#template) (See [Templates](./templates.md))
  - [`throttle`](#throttle) (See [Throttle](./throttle.md))
  - [`muteRules`](#muteRules)
  - [`muteDuration`](#muteDuration)

## Example configuration

```json
{
 "compositeRules": [
    {
      "name": "Composite Rule",
      "template": {
        "title": "title",
        "content": ["content"]
      },
      "notifCount": 6,
      "throttle": {
        "interval": "5m",
        "count": 3
      },
      "ruleCountThreshold": 2,
      "muteRules": true
    }
  ]
}
```

## Schema Properties

### `name`

The name of the composite rule. Must be unique between each composite rule.

| Type                   | Required |
|------------------------|----------|
| `string`               | ✔️       |

### `notifiers`

Defines the notifiers to send alerts on.

| Type      | Required | Default                        |
|-----------|----------|--------------------------------|
| `string[]` | ❌      | All root configured notifiers |

**Examples**
```json
{
  ...,
  "notifiers": {
    "slack": {
      "notifier": "slack",
      "webhookUrl": "https://hooks.slack.com/services/aaa/bbb"
    },
    "discord": {
      "notifier": "discord",
      "webhookUrl": "https://discord.com/api/webhooks/aaa/bbb"
    }
  },
  "compositeRules": [
    {
      "name": "Send alerts to Slack notifier only",
      "notifiers": ["slack"],
      ...
    },
    {
      "name": "notifiers are skipped: send alerts to both Slack & Discord",
      ...
    }
  ],
  ...
}
```

### `notifCount`

The minimum alert to have been sent from each rules to triggers the composite rule.

| Type     | Required |
|----------|----------|
| `number` | ✔️       |

### `ruleCountThreshold`

The minimum count of matching rules to triggers an alert to unlock composite rule.  
For instance, if you have 10 rules and `ruleCountThreshold` is 7, it means 7 rules must triggers an alert before the composite rule triggers.

| Type     | Required |
|----------|----------|
| `number` | ❌       |

### `interval`

A duration (i.e `1d`, `15m`) that represents the maximum interval date to count rules alerts.

| Type     | Required | Default |
|----------|----------|---------|
| `string` | ❌       | `1d`    |

### `template`

See [Templates](./templates.md)

> [!NOTE]
> `template` is **required**.

### `throttle`

See [Throttle](./throttle.md)

### `muteRules`

Whether matched rules should stop trigger alert when a higher-level composite rule triggers.

| Type      | Required | Default |
|-----------|----------|---------|
| `boolean` | ❌       | `false` |

### `muteUntriggered`

Whether to mute rules that haven't triggered any alerts.

| Type      | Required | Default |
|-----------|----------|---------|
| `boolean` | ❌       | `true` |

### `muteDuration`

Defines the duration for which rules should be muted when `muteRules` is `true`.

| Type     | Required | Default |
|----------|----------|---------|
| `string` | ❌       | `30m`   |

### Filterings rules

The `filters` object allows to filter rules to be included in the composite rule.

### `include`

A list of rule to monitor, you can use glob i.e `My Service -*`.  
By default, the composite rule is based on each rule.

| Type       | Required |
|------------|----------|
| `string[]` | ❌       |

### `exclude`

A list of rule to exclude from monitoring, you can use glob i.e `My Service -*`.  

| Type       | Required |
|------------|----------|
| `string[]` | ❌       |

### `severity`

A list of severity to include in the composite rule. Valid values are `information`, `warning`, `error`, `critical`.  

| Type       | Required |
|------------|----------|
| `string[]` | ❌       |
