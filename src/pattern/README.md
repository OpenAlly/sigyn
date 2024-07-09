<p align="center"><h1 align="center">
  Pattern
</h1></p>

<p align="center">
  Loki pattern in JavaScript/TypeScript
</p>

<p align="center">
  <a href="https://github.com/MyUnisoft/sigyn/src/pattern">
    <img src="https://img.shields.io/github/package-json/v/MyUnisoft/sigyn/main/src/pattern?style=for-the-badge&label=version" alt="npm version">
  </a>
  <a href="https://github.com/MyUnisoft/sigyn/src/pattern">
    <img src="https://img.shields.io/bundlephobia/min/@sigyn/pattern?style=for-the-badge" alt="size">
  </a>
<a>
    <img src="https://api.securityscorecards.dev/projects/github.com/MyUnisoft/sigyn/badge?style=for-the-badge" alt="ossf scorecard">
  </a>
  <a href="https://github.com/MyUnisoft/sigyn/tree/main/src/pattern">
    <img src="https://img.shields.io/github/actions/workflow/status/MyUnisoft/sigyn/pattern.yml?style=for-the-badge">
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
$ npm i @sigyn/pattern
# or
$ yarn add @sigyn/pattern
```

## 📚 Usage

```ts
import { Pattern } from "@sigyn/pattern";

const parser = new Pattern("HTTP <verb> <_> <endpoint>");

const parsedLogs = parser.executeOnLogs([
  "HTTP POST 200 /api/v1/dowork",
  "HTTP GET 200 /api/v1/dowork"
]);

// Automatically infer types 
for (const { verb, endpoint } of parsedLogs) {
  console.log(verb, endpoint);
}
```

You can also provide an Array to Pattern constructor (quite helpful with long or multipart patterns).

```ts
new Pattern([
  "[schema: <id>|type: <user_type>]",
  "HTTP <verb> <_> <endpoint>"
] as const)
```

> [!TIP]
> Use `as const` to benefit from type inference
## 🌐 API

- [Pattern](./docs/Pattern.md)
- [NoopPattern](./docs/NoopPattern.md)

### Shape

<em>Pattern</em> and <em>NoopPattern</em> both implement the same Shape using `PatternShape` interface.

```ts
type LokiPatternType = string | Array<string> | ReadonlyArray<string>;

interface PatternShape<T extends LokiPatternType = string> {
  compile(): (log: string) => [] | [log: LokiLiteralPattern<T>];
  executeOnLogs(logs: Array<string>): LokiLiteralPattern<T>[];
}
```

## License
MIT
