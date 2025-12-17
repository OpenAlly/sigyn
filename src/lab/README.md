<p align="center"><h1 align="center">
  Lab
</h1></p>

<p align="center">
  A test and demonstration tool for generating and exploring logs in both formatted and JSON styles, integrated with Grafana Loki via Docker.
</p>

<p align="center">
  <a href="https://github.com/OpenAlly/sigyn/src/lab">
    <img src="https://img.shields.io/github/package-json/v/OpenAlly/sigyn/main/src/lab?style=for-the-badge&label=version" alt="npm version">
  </a>
  <a href="https://github.com/OpenAlly/sigyn/src/lab">
    <img src="https://img.shields.io/bundlephobia/min/@sigyn/lab?style=for-the-badge" alt="size">
  </a>
  <a>
  <img src="https://api.securityscorecards.dev/projects/github.com/OpenAlly/sigyn/badge?style=for-the-badge" alt="ossf scorecard">
  </a>
  <a href="https://github.com/OpenAlly/sigyn/tree/main/src/lab">
    <img src="https://img.shields.io/github/actions/workflow/status/OpenAlly/sigyn/lab.yml?style=for-the-badge">
  </a>
  <a href="https://github.com/OpenAlly/sigyn/tree/main/src/LICENSE">
    <img src="https://img.shields.io/github/license/OpenAlly/sigyn?style=for-the-badge" alt="license">
  </a>
</p>

## 🚧 Requirements

- [Node.js](https://nodejs.org/en/) version 24 or higher

## 🚀 Getting Started

This package is available in the Node Package Repository and can be easily installed with [npm](https://doc.npmjs.com/getting-started/what-is-npm) or [yarn](https://yarnpkg.com)

```bash
$ npm i @sigyn/lab
# or
$ yarn add @sigyn/lab
```

## 📚 Usage

```ts
import { run } from "@sigyn/lab";

await run({
  count: 200,
  labels: {
    app: "demo-app"
  }
});
// Grafana Loki ready on http://localhost:3000 with 200 random logs.
```

## 🌐 API

### `run(options?: LogGeneratorOptions): Promise<void>`

Run Grafana + Loki via Docker (using `testcontainers`) with multiple logs.

See [`LogGenerator`](#loggenerator) for options.

Default options:
```js
{
  count: 500,
  labels: { app: "demo" }
}
```

### `LogGenerator`

The `LogGenerator` class is responsible for generating logs in two different styles: formatted strings and JSON objects. These logs are designed for testing, demonstrations, and integration with Grafana Loki.

```ts
new LogGenerator(options: LogGeneratorOptions)
```

**Constructor parameters**

`options` (optional): An object to customize log generation:
- `options.mode` (optional): Specifies the style of the logs. Can be:
  - `"formated"`: Generates logs as formatted strings.
  - `"json"`: G**enerates logs as JSON objects.
  - `"random"` **(default)**: Randomly chooses between `"formated"` and `"json"` for each log.
- `options.count` (optional): The number of logs to generate. Default is 100.
- `options.labels` (optional): An object containing custom labels to associate with each log stream. No labels by default.
- `options.startUnixEpoch` (optional): The start timestamp for logs in nanoseconds. Default is one hour before the current time.
- `options.endUnixEpoch` (optional): The end timestamp for logs in nanoseconds. Default is the current time.

### `LogGenerator.generate()`

Generates logs based on the provided options. This method is a generator function that yields individual log entries.

Example usage:

```ts
const generator = new LogGenerator({
  count: 10,
  mode: "json"
});
const logs = [...generator.generate()];

console.log(logs);
```

## 🖋️ Interfaces

```ts
interface LogGeneratorOptions {
  mode?: Mode;
  count?: number;
  labels?: Record<string, string>;
  startUnixEpoch?: number;
  endUnixEpoch?: number;
}
```

## License
MIT
