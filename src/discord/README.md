<p align="center"><h1 align="center">
  Discord
</h1></p>

<p align="center">
  Send Sigyn alerts to Discord via webhook
</p>

<p align="center">
  <a href="https://github.com/MyUnisoft/sigyn/src/discord">
    <img src="https://img.shields.io/github/package-json/v/sigyn/discord?style=for-the-badge" alt="npm version">
  </a>
   <a href="https://github.com/MyUnisoft/sigyn/tree/main/src/discord">
    <img src="https://img.shields.io/npm/dw/@sigyn/discord?style=for-the-badge" alt="download">
  </a>
  <a href="https://github.com/MyUnisoft/sigyn/src/discord">
    <img src="https://img.shields.io/bundlephobia/min/@sigyn/discord?style=for-the-badge" alt="size">
  </a>
    <img src="https://api.securityscorecards.dev/projects/github.com/MyUnisoft/sigyn/badge?style=for-the-badge" alt="ossf scorecard">
  </a>
  <a href="https://github.com/MyUnisoft/sigyn/tree/main/src/discord">
    <img src="https://img.shields.io/github/actions/workflow/status/MyUnisoft/sigyn/discord.yml?style=for-the-badge">
  </a>
  <a href="https://github.com/MyUnisoft/sigyn/tree/main/src/LICENSE">
    <img src="https://img.shields.io/github/license/MyUnisoft/sigyn?style=for-the-badge" alt="license">
  </a>
</p>

## 🚧 Requirements

- [Node.js](https://nodejs.org/en/) version 18 or higher

## 🚀 Getting Started

This package is available in the Node Package Repository and can be easily installed with [npm](https://doc.npmjs.com/getting-started/what-is-npm) or [yarn](https://yarnpkg.com)

```bash
$ npm i @sigyn/discord
# or
$ yarn add @sigyn/discord
```

## 📚 Usage

```ts
import * as discord from "@sigyn/discord";

const ruleConfig = {
  name: "test1",
  logql: "{app=\"foo\", env=\"prod\"} |= `One of the file names does not match what is expected`",
  polling: "1m",
  alert: {
    on: {
      count: 10,
      interval: "5m"
    },
    template: {
      title: "🚨 {ruleName} - Triggered {counter} times!",
      content: [
        "- LogQL: `{logql}`",
        "- Threshold: **{count}**",
        "- Interval: **{interval}**",
        "- Polling: **{polling}**"
      ]
    }
  }
};
await discord.executeWebhook({
  counter: 10,
  ruleConfig,
  webhookUrl: "https://discord.com/api/webhooks/xxx/yyy"
});
```
## API

### executeWebhook(options: ExecuteWebhookOptions): Promise<httpie.RequestResponse<string>>

Execute webhook, this method allow to send a `Sigyn` alert to your discord server.

```ts
interface ExecuteWebhookOptions {
  webhookUrl: string;
  ruleConfig: SigynRule;
  counter: number;
}

interface SigynRule {
  name: string;
  logql: string;
  polling: string;
  alert: SigynAlert;
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
**Template**

> **Note** `SigynAlertTemplate` **must** contains at least a `title` or a `content` line. 

You can use `markdown` in the `content`.

You can use theses variables in both the `title` or the `content` that will be rendered depending the rule config:
- `{ruleName}` the rule's name
- `{counter}` the rule's counter which triggered the alert
- `{logql}` the rule's LogQL
- `{count}` the maximum count threshold
- `{interval}` the rule's interval
- `{polling}` the rule's logs polling

Theses variables could be hard written in the template but it also could be useless for dynamic config and default template (**TBC**).

**Webhook URL**

Using Discord webhooks is very simple: go to you server settings, **APPS** > **Integrations** > **Webhooks** then choose or create the webhook and click *Copy Webhook URL* button 🎉

## License
MIT
