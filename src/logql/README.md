<p align="center"><h1 align="center">
  LogQL
</h1></p>

<p align="center">
  Parse and serialize LogQL query
</p>

<p align="center">
  <a href="https://github.com/MyUnisoft/sigyn/src/logql">
    <img src="https://img.shields.io/github/package-json/v/MyUnisoft/sigyn/main/src/logql?style=for-the-badge&label=version" alt="npm version">
  </a>
  <a href="https://github.com/MyUnisoft/sigyn/src/logql">
    <img src="https://img.shields.io/bundlephobia/min/@sigyn/logql?style=for-the-badge" alt="size">
  </a>
<a>
    <img src="https://api.securityscorecards.dev/projects/github.com/MyUnisoft/sigyn/badge?style=for-the-badge" alt="ossf scorecard">
  </a>
  <a href="https://github.com/MyUnisoft/sigyn/tree/main/src/logql">
    <img src="https://img.shields.io/github/actions/workflow/status/MyUnisoft/sigyn/logql.yml?style=for-the-badge">
  </a>
  <a href="https://github.com/MyUnisoft/sigyn/tree/main/src/LICENSE">
    <img src="https://img.shields.io/github/license/MyUnisoft/sigyn?style=for-the-badge" alt="license">
  </a>
</p>

## 🚧 Requirements

- [Node.js](https://nodejs.org/en/) version 20 or higher

## 🚀 Getting Started

This package is available in the Node Package Repository and can be easily installed with [npm](https://doc.npmjs.com/getting-started/what-is-npm) or [yarn](https://yarnpkg.com)

```bash
$ npm i @sigyn/logql
# or
$ yarn add @sigyn/logql
```

## 📚 Usage

**Build your LogQL**
```ts
import { LogQL } from "@sigyn/logql";

const logql = new LogQL("foo");
logql.streamSelector.set("env", "prod");
logql.lineEq("bar");
logql.lineNotEq("baz");

// {env=\"prod\"} |= `foo` |= `bar` != `baz`
console.log(logql.toString());
```

**Parse your LogQL**
```ts
import { LogQL } from "@sigyn/logql";

const logql = new LogQL("{app=\"foo\", env=\"preprod\"} |= `foo` != `bar`");

console.log([...logql.streamSelector.entries()]);
console.log(logql.lineFilters.lineContains());
console.log(logql.lineFilters.lineDoesNotContain());
```

## 🌐 API

- [LogQL](./docs/LogQL.md)

Individual LogQL parts (used in the parent class). You can also use them individually for separate needs.

```
{env="staging"} |= "req-xxx" | pattern `ok: <ok>` | ok = "true" | unpack
^^^             ^^^          ^^^                  ^^^           ^
StreamSelector  LineFilters  ParserExpression     LabelFilters  ParserExpression
```

- [StreamSelector](./docs/StreamSelector.md)
- [LineFilters](./docs/LineFilters.md)
- [LabelFilters](./docs/LabelFilters.md)
- [ParserExpression](./docs/ParserExpression.md)

## License
MIT
