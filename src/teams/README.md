<p align="center"><h1 align="center">
  Teams notifier
</h1></p>

<p align="center">
  Send Sigyn alerts to Teams via webhook
</p>

<p align="center">
  <a href="https://github.com/MyUnisoft/sigyn/src/teams">
    <img src="https://img.shields.io/github/package-json/v/sigyn/teams?style=for-the-badge" alt="npm version">
  </a>
   <a href="https://github.com/MyUnisoft/sigyn/tree/main/src/teams">
    <img src="https://img.shields.io/npm/dw/@sigyn/discord?style=for-the-badge" alt="download">
  </a>
  <a href="https://github.com/MyUnisoft/sigyn/src/teams">
    <img src="https://img.shields.io/bundlephobia/min/@sigyn/teams?style=for-the-badge" alt="size">
  </a>
    <img src="https://api.securityscorecards.dev/projects/github.com/MyUnisoft/sigyn/badge?style=for-the-badge" alt="ossf scorecard">
  </a>
  <a href="https://github.com/MyUnisoft/sigyn/tree/main/src/teams">
    <img src="https://img.shields.io/github/actions/workflow/status/MyUnisoft/sigyn/teams.yml?style=for-the-badge">
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
$ npm i @sigyn/teams
# or
$ yarn add @sigyn/teams
```

## 📚 Usage

Add the teams notifier to your Sigyn config:

```json

{
  "notifiers": {
    "@sigyn/teams": {
      "webhookUrl": "https://biz.webhook.office.com/webhook2/xxx/yyy"
    },
    ...
  },
  "rules": [
    ...
  ]
}
```

**Webhook URL**

You can follow [this guide](https://learn.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook?tabs=dotnet#create-incoming-webhooks-1s) for guidance on how to create a Teams webhook.

## License
MIT
