# Pattern

A parser that work exactly like Loki pattern (see README for usage example).

## API

```ts
class Pattern<T extends LokiPatternType> implements PatternShape<T> {}
```

### constructor(pattern: T)
Create a new instance of Pattern using either:
- a string
- an array of string
- a tuple (readonly array)

```ts
new Pattern([
  "[schema: <id>|type: <user_type>]",
  "HTTP <verb> <_> <endpoint>"
] as const)
```

### compile(): (log: string) => [] | [log: LokiLiteralPattern< T >]
Compile a function to parse a log (one by one). This method is used in executeOnLogs().

### executeOnLogs(logs: string[]): LokiLiteralPattern< T >[]
Parse an Array of logs
