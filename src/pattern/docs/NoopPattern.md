# NoopPattern
A pattern that act like the real Pattern but execute zero operation under the hood.

```ts
import { NoopPattern } from "@sigyn/pattern";
import assert from "node:assert";

const noop = new NoopPattern();

const logs = ["foobar"];
const parsedLogs = noop.executeOnLogs(logs);

assert.strictEqual(
  logs,
  parsedLogs,
  "should have the same identity/reference"
);
```

The class implement `PatternShape` interface and only has two methods:
- compile()
- executeOnLogs()
