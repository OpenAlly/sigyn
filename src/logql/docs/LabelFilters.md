# LabelFilters

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

> [!NOTE]
> The LabelFilters class extend from JavaScript [Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/) Object.

## API

### constructor(init?: string | LabelFilters)

Initializes a new instance of the `LabelFilters` class with an optional **LogQL** query string.

Available `init` types are:
- `string` - Create an instance of `LabelFilters` given a **LogQL** query to parse.
- `LabelFilters` - Create an instance of `LabelFilters` based on another `LabelFilters` class.

### set(labelKey: string, labelValue: LabelValue[] | LabelValue | string | number, op?: LabelFilterOperator)

> [!IMPORTANT]
> This method override the `Map` default `set` method.

Add a new label filter with a specified key and value.

If `labelValue` is a `LabelValue` (or an array of `LabelValue`), the default operator will be an `=` and can be either be passed via the `operator` property of `LabelValue` or as a third argument to be modified.

If `labelValue` is a `string` or a `number`, the default operator will be an **exactlyEqual** and must be passed as a third argument to be modified.

### kv(): Record< string, string[] >

Return a key-value object reprensenting label filters where each value is an array of `string` (operator is skipped)

### toJSON(): Record< string, LabelFilter[] >

Return a key-value object representing label filters where each value is an array of object with `operator` and `value`.

### toString(): string

Converts the `LabelFilters` instance into a partial LogQL query string.
Returns a string representing the partial LogQL query.
