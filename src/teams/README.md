<p align="center"><h1 align="center">
  Teams notifier
</h1></p>

<p align="center">
  Send Sigyn alerts to Teams via webhook
</p>

<p align="center">
  <a href="https://github.com/OpenAlly/sigyn/src/teams">
    <img src="https://img.shields.io/github/package-json/v/OpenAlly/sigyn/main/src/teams?style=for-the-badge&label=version" alt="npm version">
  </a>
  <a href="https://github.com/MyUnisOpenAllyoft/sigyn/src/teams">
    <img src="https://img.shields.io/bundlephobia/min/@sigyn/teams?style=for-the-badge" alt="size">
  </a>
<a>
    <img src="https://api.securityscorecards.dev/projects/github.com/OpenAlly/sigyn/badge?style=for-the-badge" alt="ossf scorecard">
  </a>
  <a href="https://github.com/OpenAlly/sigyn/tree/main/src/teams">
    <img src="https://img.shields.io/github/actions/workflow/status/OpenAlly/sigyn/teams.yml?style=for-the-badge">
  </a>
  <a href="https://github.com/OpenAlly/sigyn/tree/main/src/LICENSE">
    <img src="https://img.shields.io/github/license/OpenAlly/sigyn?style=for-the-badge" alt="license">
  </a>
</p>

```bash
$ npm i @sigyn/teams
# or
$ yarn add @sigyn/teams
```

## 📚 Usage

Add the Teams notifier to your Sigyn config:

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

> [!IMPORTANT]
> Unlike other notifiers, **Teams** require both a `title` and a `content` otherwise it will fail with a 400.
**Webhook URL**

You can follow [this guide](https://learn.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook?tabs=dotnet#create-incoming-webhooks-1s) for guidance on how to create a Teams webhook.

## License
MIT
