<p align="center"><h1 align="center">
  Morphix
</h1></p>

<p align="center">
  Micro templating with function pipes support
</p>

<p align="center">
  <a href="https://github.com/MyUnisoft/sigyn/src/morphix">
    <img src="https://img.shields.io/github/package-json/v/MyUnisoft/sigyn/main/src/morphix?style=for-the-badge&label=version" alt="npm version">
  </a>
  <a href="https://github.com/MyUnisoft/sigyn/src/morphix">
    <img src="https://img.shields.io/bundlephobia/min/@sigyn/morphix?style=for-the-badge" alt="size">
  </a>
<a>
    <img src="https://api.securityscorecards.dev/projects/github.com/MyUnisoft/sigyn/badge?style=for-the-badge" alt="ossf scorecard">
  </a>
  <a href="https://github.com/MyUnisoft/sigyn/tree/main/src/morphix">
    <img src="https://img.shields.io/github/actions/workflow/status/MyUnisoft/sigyn/morphix.yml?style=for-the-badge">
  </a>
  <a href="https://github.com/MyUnisoft/sigyn/tree/main/src/LICENSE">
    <img src="https://img.shields.io/github/license/MyUnisoft/sigyn?style=for-the-badge" alt="license">
  </a>
</p>

## 🚀 Getting Started

This package is available in the Node Package Repository and can be easily installed with [npm](https://doc.npmjs.com/getting-started/what-is-npm) or [yarn](https://yarnpkg.com)

```bash
$ npm i @sigyn/morphix
# or
$ yarn add @sigyn/morphix
```

## 📚 Usage

```ts
import { morphix } from "@sigyn/morphix";

await morphix("Hello {name | capitalize}", { name: "john" });
```

> [!IMPORTANT]
> `morphix()` is asynchrone because it supports async **functions**

## 🌐 API

### `morphix`

```ts
async function morphix(
  template: string,
  data: Record<string, any> | unknown[],
  options: MorphixOptions = {}
): Promise<string>
```

**template**
Type: `string`

Text with placeholders for data properties.

**data**
Type: `object | unknown[]`

Data to interpolate into template.

The keys should be a valid JS identifier or number (a-z, A-Z, 0-9).

#### Options

```ts
type MorphixFunction = (value: string) => Promise<string> | string;

export interface MorphixOptions {
  /**
   * Performs arbitrary operations for each interpolation.
   * If the returned value is undefined, the behavior depends on the ignoreMissing option.
   * Otherwise, the returned value is converted to a string and embedded into the template.
   */
  transform?: (data: { value: unknown; key: string }) => unknown;
  /**
   * By default, Morphix throws a MissingValueError when a placeholder resolves to undefined.
   * If this option is set to true, it simply ignores the unresolved placeholder and leaves it as is.
   *
   * @default false
   */
  ignoreMissing?: boolean;
  customFunctions?: Record<string, MorphixFunction>;
}
```

> [!NOTE]
> MissingValueError is exported, which is useful for instance and type checking.

## 📦 Functions

**capitalize**

Capitalize the first letter.

**dnsresolve**

Retrieve host of a given IP. It uses `dns.reverse`.

If it fails to retrieve the host, it returns the ip instead.

### Adding custom functions

Morphix lets you inject your own custom functions.

```ts
import { morphix } from "@sigyn/morphix";
import assert from "node:assert";

const transformedData = await morphix(
  "{ data | lower }",
  { data: "HELLO WORLD" },
  {
    customFunctions: {
      lower: (value) => value.toLowerCase()
    }
  }
);
assert.strictEqual(
  transformedData,
  "hello world"
);
```

## Credits
This package is heavily inspired by [pupa](https://github.com/sindresorhus/pupa). Morphix is a fork that includes function support and does not support HTML escape.

## License
MIT
