<p align="center"><h1 align="center">
  Notifiers
</h1></p>

<p align="center">
  Helpers to build a Sigyn notifier
</p>

<p align="center">
  <a href="https://github.com/MyUnisoft/sigyn/src/notifiers">
    <img src="https://img.shields.io/github/package-json/v/MyUnisoft/sigyn/main/src/notifiers?style=for-the-badge&label=version" alt="npm version">
  </a>
  <a href="https://github.com/MyUnisoft/sigyn/src/notifiers">
    <img src="https://img.shields.io/bundlephobia/min/@sigyn/notifiers?style=for-the-badge" alt="size">
  </a>
<a>
    <img src="https://api.securityscorecards.dev/projects/github.com/MyUnisoft/sigyn/badge?style=for-the-badge" alt="ossf scorecard">
  </a>
  <a href="https://github.com/MyUnisoft/sigyn/tree/main/src/notifiers">
    <img src="https://img.shields.io/github/actions/workflow/status/MyUnisoft/sigyn/notifiers.yml?style=for-the-badge">
  </a>
  <a href="https://github.com/MyUnisoft/sigyn/tree/main/src/LICENSE">
    <img src="https://img.shields.io/github/license/MyUnisoft/sigyn?style=for-the-badge" alt="license">
  </a>
</p>

## 🚀 Getting Started

This package is available in the Node Package Repository and can be easily installed with [npm](https://doc.npmjs.com/getting-started/what-is-npm) or [yarn](https://yarnpkg.com)

```bash
$ npm i @sigyn/notifiers
# or
$ yarn add @sigyn/notifiers
```

## 📚 Usage

> [!IMPORTANT]
> Each notifier **must** export a `execute` function. This function is dynamically
> imported by Sigyn to send the alert. The function takes a single object argument with
> the configured options (in the config), the template (initialized from config) and the data to be templated (provided by the Agent).

### Webhook

Create a class that extends from `WebhookNotifier` to build a Webhook notifier.

```ts
import { ExecuteWebhookOptions, WebhookNotifier } from "@sigyn/notifiers";

class MyAwesomeWebhookNotifier extends WebhookNotifier {
  async formatWebhook(): Promise<any> {
    const title = await this.formatTitle();
    const content = await this.formatContent();

    return {
      title,
      content.join("\n")
    }
  }
}

export function execute(options: ExecuteWebhookOptions) {
  const notifier = new MyAwesomeWebhookNotifier(options);

  return notifier.execute();
}
```
The only required method to implement is `formatWebhook()`.
This method return the Webhook body.

```ts
async execute() {
  const body = await this.formatWebhook();

  return httpie.post<string>(this.webhookUrl, {
    body,
    headers: this.#headers
  });
}
```
You can use `formatTitle()` & `formatContent()` to get title & content formatted with template data. Theses functions uses `@sigyn/morphix` and you can customise the options of boths:
```ts
class MyAwesomeWebhookNotifier extends WebhookNotifier {
  contentTemplateOptions() {
    return {
      transform: ({ value }) => (value === undefined ? "unknown" : value),
      ignoreMissing: true
    }
  }

  titleTemplateOptions() {
    return {
      transform: ({ value }) => (value === undefined ? "unknown" : value),
      ignoreMissing: true
    }
  }

  async formatWebhook(): Promise<any> {
    const title = await this.formatTitle();
    const content = await this.formatContent();

    return {
      title,
      content.join("\n")
    }
  }
}
```

> [!NOTE]
> The `contentTemplateOptions` & `titleTemplateOptions` above are the default values.
By default, `showSeverityEmoji` is truthy: this option add an emoji before the title depending the alert **severity**.

```ts
const kSeverityEmoji = {
  critical: "💥",
  error: "❗️",
  warning: "⚠️",
  info: "📢"
};
```

You can do `this.showSeverityEmoji = false` to disable this behavior.
```ts
async formatWebhook(): Promise<any> {
  this.showSeverityEmoji = false;

  const title = await this.formatTitle();
  const content = await this.formatContent();

  return {
    title,
    content.join("\n")
  }
}
```

You can also disable it in the constructor
```ts
class MyAwesomeWebhookNotifier extends WebhookNotifier {
  // directly set the property to false
  showSeverityEmoji = false;

  constructor(options: ExecuteWebhookOptions) {
    super(options);
    // or
    this.showSeverityEmoji = false;
  }
}
```

You can see implementation examples with our notifiers:
- [`@sigyn/discord`](../discord/src/index.ts)
- [`@sigyn/slack`](../slack/src/index.ts)
- [`@sigyn/teams`](../teams/src/index.ts)

## 🌐 API

### `WebhookNotifier`

See [`Webhook`](#webhook)

## 🖋️ Interfaces

```ts
interface ExecuteWebhookOptions {
  webhookUrl: string;
  data: ExecuteWebhookData;
  template: SigynInitializedTemplate;
}
interface ExecuteWebhookData {
  ruleConfig?: NotifierFormattedSigynRule;
  counter?: number;
  severity: "critical" | "error" | "warning" | "info";
  label?: Record<string, string>;
  lokiUrl?: string;
  agentFailure?: {
    errors: string;
    rules: string;
  };
  rules?: string;
}
```

## License
MIT
