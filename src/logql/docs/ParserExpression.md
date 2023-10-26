# ParserExpression

Parser expression can parse and extract labels from the log content. Those extracted labels can then be used for filtering using [label filter expressions](https://grafana.com/docs/loki/latest/logql/log_queries/#label-filter-expression) or for [metric aggregations](https://grafana.com/docs/loki/latest/logql/metric_queries/).

Extracted label keys are automatically sanitized by all parsers, to follow Prometheus metric name convention.(They can only contain ASCII letters and digits, as well as underscores and colons. They cannot start with a digit.)

Loki supports [JSON](https://grafana.com/docs/loki/latest/logql/log_queries/#json), [logfmt](https://grafana.com/docs/loki/latest/logql/log_queries/#logfmt), [pattern](https://grafana.com/docs/loki/latest/logql/log_queries/#pattern), [regexp]() and [unpack](https://grafana.com/docs/loki/latest/logql/log_queries/#unpack) parsers and each one is also supported by `ParserExpression` 🎉 

```ts
class ParserExpression {}
```

## API

### constructor(init?: string | ParserExpression)

Initializes a new instance of the `ParserExpression` class with an optional **LogQL** query string.

Available `init` types are:
- `string` - Create an instance of `ParserExpression` given a **LogQL** query to parse.
- `ParserExpression` - Create an instance of `ParserExpression` based on another `ParserExpression` class.

### toJson(params?: string | Record< string, string >): ParserExpression

Add a `json` parser expression.<br>
Argument can be a string representing a label equal to a json field or an object reprensenting a map from each label to its json field.

### toLogfmt(params?: string | Record<string, string>): ParserExpression

Add a `logfmt` parser expression.<br>
Argument can be a string representing a label to extract or an object reprensenting a map from each label to its renamed label.

### toPattern(params: string | string[]): ParserExpression

Add a `pattern` parser expression.<br>
Argument can be a string representing a pattern expression or an array of strings reprensenting multiple pattern expressions.

### toRegexp(params: string | string[]): ParserExpression

Add a `regexp` parser expression.<br>
Argument can be a string representing a regexp expression or an array of strings reprensenting multiple regexp expressions.

### toUnpack(): ParserExpression

Enable `unpack` parser, unpacking all embedded labels from Promtail’s [pack](https://grafana.com/docs/loki/latest/clients/promtail/stages/pack/) stage.

## Low and high string end

When we transform the LogQL to a string we use two distinct methods:
- lowStringEnd (includes pattern and regexp)
- highStringEnd (includes json, logfmt and unpack)

```ts
toString() {
  return `
    ${this.streamSelector.toString()}
    ${this.lineFilters.toString()}
    ${this.parserExpression.lowStringEnd()}
    ${this.labelFilters.toString()}
    ${this.parserExpression.highStringEnd()}
  `.trim().replace(/\s\s+/g, " ");
}
```

We need to do this because LabelFilters need pattern and regexp to be declared before.

Here a real example; 
```
{app=\"discussion\",env=\"production\"} |= `returned ` | regexp `((?P<execTime>[0-9.]+)ms)` | execTime > 500
```

The regexp need to be ahead of the filter `execTime > 500`. Else the filter will consider the label `execTime` to be not defined.
