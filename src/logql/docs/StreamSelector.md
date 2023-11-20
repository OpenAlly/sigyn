# StreamSelector

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

> [!NOTE]
> The StreamSelector class extend from JavaScript [Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/) Object.

## API

### constructor(init?: string | string[] | Iterable< [string, string] > | StreamSelector)

Initializes a new instance of the `StreamSelector` class with an optional LogQL query string.

Available `init` types are:
- `string` - Create an instance of `StreamSelector` given a **LogQL** query to parse.
- `string[]` - Create an instance of `StreamSelector` given multiple **LogQL** queries to parse.
- `Record<string, string | RegExp | StreamSelectorOp>` - Create an instance of `StreamSelector` given a key-value object. By default, the operator is an **exactlyEqual** (`=`) if value is `string` or a **Matches Regexp** (`=~`) if value is `RegExp`. `StreamSelectorOp` is returned by `StreamSelector.Equal()` & `StreamSelector.Not()`.
- `Iterable<[string, string]>` - Create an instance of `StreamSelector` given a `key`-`value` iterable. The default operator will be an **exactlyEqual** (`=`).
- `StreamSelector` - Create an instance of `StreamSelector` based on another `StreamSelector` class.

### `static Equal(value: string | RegExp)`

Utility static method that allow to init **exactlyEqual** (`=`) or **Matches Regexp** (`=~`) values via Object, depending weither value is `string` or `RegExp`.

```ts
const streamSelector = new StreamSelector({ foo: StreamSelector.Equal("bar") })
```

This is equal to:
```ts
const streamSelector = new StreamSelector({ foo: "bar" })
```

### `static Not(value: string | RegExp)`

Utility static method that allow to init **notEqual** (`!=`) or **Does not Match** (`!~`) values via Object.

```ts
const streamSelector = new StreamSelector({ foo: StreamSelector.Not("bar") })
```

### set(labelKey: string, labelValue: LabelValue | string, op?: LabelMatchingOperator)`

> [!IMPORTANT]
> This method override the `Map` default `set` method.

Add a new stream selector with a specified key and value.

If `labelValue` is a `LabelValue`, the default operator will be an **exactlyEqual** and can be either be passed via the `operator` property of `LabelValue` or as a third argument to be modified.

If `labelValue` is a `string`, the default operator will be an **exactlyEqual** and must be passed as a third argument to be modified.

```ts
type LabelValue = Partial<StreamSelectorValue> & Pick<StreamSelectorValue, "value">;
```

### kv(): Record< string, string >

Return a key-value object reprensenting stream selectors where each value is a `string` (operator is skipped)

```ts
const logql = "{foo=\"bar\"}";

const result = new StreamSelector(logql).kv();
console.log(result.foo); // bar
```

### toJSON(): Record< string, StreamSelectorValue >

Return a key-value object representing stream selectors where each value is an object with `operator` and `value`.

### toString(): string

Converts the `StreamSelector` instance into a partial LogQL query string.
Returns a string representing the partial LogQL query.

```ts
const selector = new StreamSelector();
selector.set("foo", "bar");

// {foo="bar"}
console.log(selector.toString());
```
