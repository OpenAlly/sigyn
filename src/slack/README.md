<p align="center"><h1 align="center">
  Slack notifier
</h1></p>

<p align="center">
  Send Sigyn alerts to Slack via webhook
</p>

<p align="center">
  <a href="https://github.com/MyUnisoft/sigyn/src/slack">
    <img src="https://img.shields.io/github/package-json/v/MyUnisoft/sigyn/main/src/slack?style=for-the-badge&label=version" alt="npm version">
  </a>
   <a href="https://github.com/MyUnisoft/sigyn/tree/main/src/slack">
    <img src="https://img.shields.io/npm/dw/@sigyn/discord?style=for-the-badge" alt="download">
  </a>
  <a href="https://github.com/MyUnisoft/sigyn/src/slack">
    <img src="https://img.shields.io/bundlephobia/min/@sigyn/slack?style=for-the-badge" alt="size">
  </a>
    <img src="https://api.securityscorecards.dev/projects/github.com/MyUnisoft/sigyn/badge?style=for-the-badge" alt="ossf scorecard">
  </a>
  <a href="https://github.com/MyUnisoft/sigyn/tree/main/src/slack">
    <img src="https://img.shields.io/github/actions/workflow/status/MyUnisoft/sigyn/slack.yml?style=for-the-badge">
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
$ npm i @sigyn/slack
# or
$ yarn add @sigyn/slack
```

## 📚 Usage

Add the Slack notifier to your Sigyn config:

```json

{
  "notifiers": {
    "@sigyn/slack": {
      "webhookUrl": "https://hooks.slack.com/services/aaa/bbb"
    },
    ...
  },
  "rules": [
    ...
  ]
}
```

**Webhook URL**

You can follow [this guide](https://api.slack.com/messaging/webhooks) for guidance on how to create a Slack webhook.

## License
MIT
