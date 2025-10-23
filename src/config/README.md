<p align="center"><h1 align="center">
  Config
</h1></p>

<p align="center">
  Sigyn configuration manager
</p>

<p align="center">
  <a href="https://github.com/OpenAlly/sigyn/src/config">
    <img src="https://img.shields.io/github/package-json/v/OpenAlly/sigyn/main/src/config?style=for-the-badge&label=version" alt="npm version">
  </a>
  <a href="https://github.com/OpenAlly/sigyn/src/config">
    <img src="https://img.shields.io/bundlephobia/min/@sigyn/config?style=for-the-badge" alt="size">
  </a>
  <a>
    <img src="https://api.securityscorecards.dev/projects/github.com/OpenAlly/sigyn/badge?style=for-the-badge" alt="ossf scorecard">
  </a>
  <a href="https://github.com/OpenAlly/sigyn/tree/main/src/config">
    <img src="https://img.shields.io/github/actions/workflow/status/OpenAlly/sigyn/config.yml?style=for-the-badge">
  </a>
  <a href="https://github.com/OpenAlly/sigyn/tree/main/src/LICENSE">
    <img src="https://img.shields.io/github/license/OpenAlly/sigyn?style=for-the-badge" alt="license">
  </a>
</p>

## Please see the full documentation [here](https://openally.github.io/sigyn/config/).

## 🧠 Visual Studio Code JSON schema

You can easily enjoy autocompletion & documentation from JSON schema for your `sigyn.config.json` on Visual Studio Code.

1. Go in settings. <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd> -> **Preferences: Open User Settings (JSON)**
2. Add the JSON Schemas:
```json
"json.schemas": [
  {
    "fileMatch": ["*.sigyn.config.json"],
    "url":  "https://raw.githubusercontent.com/OpenAlly/sigyn/main/src/config/src/schemas/extendedConfigSchema.json"
  },
  {
    "fileMatch": ["sigyn.config.json"],
    "url":  "https://raw.githubusercontent.com/OpenAlly/sigyn/main/src/config/src/schemas/configSchema.json"
  }
]
```

## 🌐 API

### `initConfig(path: string | URL): Promise<SigynConfig>`

Initialize **Sigyn** config given the path to the JSON config file.

### `getConfig(): SigynConfig`

Returns the previously initialized **Sigyn** config.

> [!NOTE]
> If you try to get config while the config has not been initialized, it will throws.

### `validateConfig(config: PartialSigynConfig): void`

Validate Sigyn configuration against an internal AJV Schema.

### `validateExtendedConfig(config: ExtendedSigynConfig): void`

Validate Sigyn extended configuration against an internal AJV Schema.

## 🖋️ Interfaces

See [Interfaces](./docs/interfaces.md)

## License
MIT
