<p align="center"><h1 align="center">
  Discord notifier
</h1></p>

<p align="center">
  Send Sigyn alerts to Discord via webhook
</p>

<p align="center">
  <a href="https://github.com/MyUnisoft/sigyn/src/discord">
    <img src="https://img.shields.io/github/package-json/v/MyUnisoft/sigyn/main/src/discord?style=for-the-badge&label=version" alt="npm version">
  </a>
  <a href="https://github.com/MyUnisoft/sigyn/src/discord">
    <img src="https://img.shields.io/bundlephobia/min/@sigyn/discord?style=for-the-badge" alt="size">
  </a>
  <a>
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

Add the Discord notifier to your Sigyn config:

```json

{
  "notifiers": {
    "@sigyn/discord": {
      "webhookUrl": "https://discord.com/api/webhooks/xxx/yyy"
    },
    ...
  },
  "rules": [
    ...
  ]
}
```

**Webhook URL**

Using Discord webhooks is very simple: go to you server settings, **APPS** > **Integrations** > **Webhooks** then choose or create your webhook and click **Copy Webhook URL** button 🎉

## License
MIT
