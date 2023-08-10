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

- [Node.js](https://nodejs.org/en/) version 18 or higher

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

### LogQL

**Constructor**

Initializes a new instance of the `LogQL` class.

---

**Parameters:**
- `init` Optional, the behavior depends on the `init` argument given.
  - `string` - Create an instance of `LogQL` with a **lineContains** (`lineFilter`) operator.
  - `string[]` - Create an instance of `LogQL` with multiple **lineContains** (`lineFilter`) operators.
  - `StreamSelector` - Create an instance of `LogQL` based on a `StreamSelector` subclass.
  - `LineFilters` - Create an instance of `LogQL` based on a `LineFilters` subclass.
  - `StreamSelector` - Create an instance of `LogQL` based on a `LabelFilters` subclass.
  - `ParserExpression` - Create an instance of `LogQL` based on a `ParserExpression` subclass.

---

**Properties**

- `streamSelector` - see [StreamSelector](./#StreamSelector)
- `lineFilters` - see [LineFilters](./#LineFilters)
- `labelFilters` - see [LabelFilters](./#LabelFilters)
- `parserExpression` - see [ParserExpression](./#ParserExpression)

---

**Methods**

- `lineEq(value: string): LogQL`

Add a **lineContains** (`|=`) line filter.

- `lineNotEq(value: string): LogQL`

Add a **lineDoesNotContain** (`!=`) line filter.

- `lineRegEq(value: string): LogQL`

Add a **lineContainsRegexMatch** (`|~`)

- `lineRegNotEq(value: string): LogQL`

Add a **lineDoesNotContainRegexMatch** (`!~`) line filter.

- `toString(): string`

Converts the LogQL instance into a LogQL query string.
Returns a string representing the LogQL query.

### StreamSelector

This class help to deal with **Stream Selectors**

The stream selector determines which log streams to include in a query’s results. A log stream is a unique source of log content, such as a file. A more granular log stream selector then reduces the number of searched streams to a manageable volume. This means that the labels passed to the log stream selector will affect the relative performance of the query’s execution.

The log stream selector is specified by one or more comma-separated key-value pairs. Each key is a log label and each value is that label’s value. Curly braces (`{` and `}`) delimit the stream selector.

Consider this stream selector:

```
{app="mysql",name="mysql-backup"}
```

All log streams that have both a label of `app` whose value is `mysql` and a label of `name` whose value is `mysql-backup` will be included in the query results. A stream may contain other pairs of labels and values, but only the specified pairs within the stream selector are used to determine which streams will be included within the query results.

```ts
type LabelMatchingOperator = "=" | "!=" | "=~" | "!~";

interface StreamSelectorValue {
  value: string;
  operator: LabelMatchingOperator;
}

class StreamSelector extends Map<string, StreamSelectorValue> {}
```

**Constructor**

Initializes a new instance of the `StreamSelector` class with an optional LogQL query string.

---

**Parameters:**
- `init` Optional, the behavior depends on the `init` argument given.
  - `string` - Create an instance of `StreamSelector` given a **LogQL** query to parse.
  - `string[]` - Create an instance of `StreamSelector` given multiple **LogQL** queries to parse.
  - `Iterable<[string, string]>` - Create an instance of `StreamSelector` given a `key`-`value` iterable. The default operator will be an **exactlyEqual** (`=`).
  - `StreamSelector` - Create an instance of `StreamSelector` based on another `StreamSelector` class.

---

**Properties**

See [Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/)

---

**Methods**

See [Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/)

- `set(labelKey: string, labelValue: LabelValue | string, op?: LabelMatchingOperator)`

Add a new stream selector with a specified key and value.

If `labelValue` is a `LabelValue`, the default operator will be an **exactlyEqual** and can be either be passed via the `operator` property of `LabelValue` or as a third argument to be modified.

If `labelValue` is a `string`, the default operator will be an **exactlyEqual** and must be passed as a third argument to be modified.

> **Note** This method override the `Map` default `set` method.

```ts
type LabelMatchingOperator = "=" | "!=" | "=~" | "!~";

export interface StreamSelectorValue {
  value: string;
  operator: LabelMatchingOperator;
}

type LabelValue = Partial<StreamSelectorValue> & Pick<StreamSelectorValue, "value">;
```
---
- `toString(): string`

Converts the `StreamSelector` instance into a partial LogQL query string.
Returns a string representing the partial LogQL query.

### LineFilters

This class help to deal with **Line Filters**

The line filter expression does a distributed `grep` over the aggregated logs from the matching log streams. It searches the contents of the log line, discarding those lines that do not match the case-sensitive expression.

Each line filter expression has a **filter operator** followed by text or a regular expression. These filter operators are supported:

- `|=`: Log line contains string
- `!=`: Log line does not contain string
- `|~`: Log line contains a match to the regular expression
- `!~`: Log line does not contain a match to the regular expression

```ts
type LineFilterOperator = "lineContains" | "lineDoesNotContain" | "lineContainsRegexMatch" | "lineDoesNotContainRegexMatch";

class LineFilters extends Map<LineFilterOperator, string[]> {}
```

**Constructor**

Initializes a new instance of the `LineFilters` class with an optional **LogQL** query string.

---

**Parameters:**
- `init` Optional, the behavior depends on the `init` argument given.
  - `string` - Create an instance of `LineFilters` given a **LogQL** query to parse.
  - `LineFilters` - Create an instance of `LineFilters` based on another `LineFilters` class.

---

**Properties**

See [Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/)

---

**Methods**

See [Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/)

- `add(value: string, operator: LineFilterOperator = "lineContains"): LineFilters`

Register a new line filter expression.<br>
Operator can be one of `lineContains`, `lineDoesNotContain`, `lineContainsRegexMatch`, `lineDoesNotContainRegexMatch`.

- `lineContains(): string[]`

Get each **lineContains** expressions.

- `lineDoesNotContain(): string[]`

Get each **lineDoesNotContain** expressions.

- `lineContainsRegexMatch(): string[]`

Get each **lineContainsRegexMatch** expressions.

- `lineDoesNotContainRegexMatch(): string[]`

Get each **lineDoesNotContainRegexMatch** expressions.

- `toString(): string`

Converts the `LineFilters` instance into a partial LogQL query string.
Returns a string representing the partial LogQL query.

### LabelFilters

This class help to deal with **Label Filters**

Label filter expression allows filtering log line using their original and extracted labels. It can contain multiple predicates.

A predicate contains a **label identifier**, an **operation** and a **value** to compare the label with.

For example with `cluster="namespace"` the cluster is the label identifier, the operation is = and the value is “namespace”. The label identifier is always on the left side of the operation.

```ts
type LabelFilterOperator = "=" | "==" | "!=" | "=~" | "!~" | ">" | ">=" | "<" | "<=";

interface LabelFilter {
  value: number | string;
  operator: LabelFilterOperator;
}

class LabelFilters extends Map<string, LabelFilter[]> {}
```

**Constructor**

Initializes a new instance of the `LabelFilters` class with an optional **LogQL** query string.

---

**Parameters:**
- `init` Optional, the behavior depends on the `init` argument given.
  - `string` - Create an instance of `LabelFilters` given a **LogQL** query to parse.
  - `LabelFilters` - Create an instance of `LabelFilters` based on another `LabelFilters` class.

---

**Properties**

See [Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/)

---

**Methods**

See [Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/)

- `set(labelKey: string, labelValue: LabelValue[] | LabelValue | string | number, op?: LabelFilterOperator)`

Add a new label filter with a specified key and value.

If `labelValue` is a `LabelValue` (or an array of `LabelValue`), the default operator will be an `=` and can be either be passed via the `operator` property of `LabelValue` or as a third argument to be modified.

If `labelValue` is a `string` or a `number`, the default operator will be an **exactlyEqual** and must be passed as a third argument to be modified.

> **Note** This method override the `Map` default `set` method.

- `toString(): string`

Converts the `LabelFilters` instance into a partial LogQL query string.
Returns a string representing the partial LogQL query.

### ParserExpression

Parser expression can parse and extract labels from the log content. Those extracted labels can then be used for filtering using [label filter expressions](https://grafana.com/docs/loki/latest/logql/log_queries/#label-filter-expression) or for [metric aggregations](https://grafana.com/docs/loki/latest/logql/metric_queries/).

Extracted label keys are automatically sanitized by all parsers, to follow Prometheus metric name convention.(They can only contain ASCII letters and digits, as well as underscores and colons. They cannot start with a digit.)

Loki supports [JSON](https://grafana.com/docs/loki/latest/logql/log_queries/#json), [logfmt](https://grafana.com/docs/loki/latest/logql/log_queries/#logfmt), [pattern](https://grafana.com/docs/loki/latest/logql/log_queries/#pattern), [regexp]() and [unpack](https://grafana.com/docs/loki/latest/logql/log_queries/#unpack) parsers and each one is also supported by `ParserExpression` 🎉 

```ts
class ParserExpression {}
```

**Constructor**

Initializes a new instance of the `ParserExpression` class with an optional **LogQL** query string.

---

**Parameters:**
- `init` Optional, the behavior depends on the `init` argument given.
  - `string` - Create an instance of `ParserExpression` given a **LogQL** query to parse.
  - `ParserExpression` - Create an instance of `ParserExpression` based on another `ParserExpression` class.

---

**Properties**

- `toJson(params?: string | Record<string, string>): ParserExpression`

Add a `json` parser expression.<br>
Argument can be a string representing a label equal to a json field or an object reprensenting a map from each label to its json field.

- `toLogfmt(params?: string | Record<string, string>): ParserExpression`

Add a `logfmt` parser expression.<br>
Argument can be a string representing a label to extract or an object reprensenting a map from each label to its renamed label.


- `toPattern(params: string | string[]): ParserExpression`

Add a `pattern` parser expression.<br>
Argument can be a string representing a pattern expression or an array of strings reprensenting multiple pattern expressions.

- `toRegexp(params: string | string[]): ParserExpression`

Add a `regexp` parser expression.<br>
Argument can be a string representing a regexp expression or an array of strings reprensenting multiple regexp expressions.

- `toUnpack(): ParserExpression`

Enable `unpack` parser, unpacking all embedded labels from Promtail’s [pack](https://grafana.com/docs/loki/latest/clients/promtail/stages/pack/) stage.

## License
MIT
