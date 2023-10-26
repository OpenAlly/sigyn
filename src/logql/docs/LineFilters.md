# LineFilters

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

> [!NOTE]
> The LineFilters class extend from JavaScript [Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/) Object.

## API

### constructor(init?: string | LineFilters)

Initializes a new instance of the `LineFilters` class with an optional **LogQL** query string.

Available `init` types are:
- `string` - Create an instance of `LineFilters` given a **LogQL** query to parse.
- `LineFilters` - Create an instance of `LineFilters` based on another `LineFilters` class.

### add(value: string, operator: LineFilterOperator = "lineContains"): LineFilters

Register a new line filter expression.<br>
Operator can be one of `lineContains`, `lineDoesNotContain`, `lineContainsRegexMatch`, `lineDoesNotContainRegexMatch`.

### lineContains(): string[]

Get each **lineContains** expressions.

### lineDoesNotContain(): string[]

Get each **lineDoesNotContain** expressions.

### lineContainsRegexMatch(): string[]

Get each **lineContainsRegexMatch** expressions.

### lineDoesNotContainRegexMatch(): string[]

Get each **lineDoesNotContainRegexMatch** expressions.

### toString(): string

Converts the `LineFilters` instance into a partial LogQL query string.
Returns a string representing the partial LogQL query.
