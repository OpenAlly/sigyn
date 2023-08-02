<p align="center"><h1 align="center">
  Agent
</h1></p>

<p align="center">
  Sigyn alerting agent
</p>

<p align="center">
  <a href="https://github.com/MyUnisoft/sigyn/src/agent">
    <img src="https://img.shields.io/github/package-json/v/sigyn/agent?style=for-the-badge" alt="npm version">
  </a>
   <a href="https://github.com/MyUnisoft/sigyn/tree/main/src/agent">
    <img src="https://img.shields.io/npm/dw/@sigyn/discord?style=for-the-badge" alt="download">
  </a>
  <a href="https://github.com/MyUnisoft/sigyn/src/agent">
    <img src="https://img.shields.io/bundlephobia/min/@sigyn/agent?style=for-the-badge" alt="size">
  </a>
    <img src="https://api.securityscorecards.dev/projects/github.com/MyUnisoft/sigyn/badge?style=for-the-badge" alt="ossf scorecard">
  </a>
  <a href="https://github.com/MyUnisoft/sigyn/tree/main/src/agent">
    <img src="https://img.shields.io/github/actions/workflow/status/MyUnisoft/sigyn/agent.yml?style=for-the-badge">
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
$ npm i @sigyn/agent
# or
$ yarn add @sigyn/agent
```

### Add environment variables

```bash
$ touch .env
```

Add these variables:
```

```Dotenv
# Required
GRAFANA_API_TOKEN=your_token
# Default to sigyn.sqlite3
SIGYN_DB=your_db
# Optional. When using default logger (pino), it enables pino-pretty transport if MODE is dev 
MODE=dev
```

### Add Sigyn config

```bash
$ touch config.json
```

Please see [here](../config/README.md#example-configuration) for config documentation

## 📚 Usage

```ts
import { start } from "@sigyn/agent";

await start();
```

## 🌐 API

### `start(location?: string, logger?: Logger): ToadScheduler`

Run Sigyn agent. It will fetch logs depending your rules `polling` and send alerts when `count` threshold is reached.

- `location: string` Optional, default to `process.cwd()`. The path to your SQLite database, it will create the file if it doesn't exists but the directory **must** exists.
- `logger: Logger` Optional, default to `pino`. You can use your own logger which must be an object with theses 2 methods: `info` & `error`.

The returned scheduler instance allow you to put some extra logic if needed, see [API for scheduler](https://github.com/kibertoad/toad-scheduler/blob/main/README.md#api-for-scheduler).

## 🖋️ Interfaces

```ts
interface Logger {
  info: (message: string) => void;
  error: (message: string) => void;
}
```

## License
MIT
