<p align="center">
  <img alt="# Sigyn" width="600" src="https://user-images.githubusercontent.com/4438263/256920053-ae303fbe-537d-44d8-8a12-cea4b5c65ad8.png">
</p>

<p align="center">
  <a href="https://github.com/OpenAlly/sigyn">
    <img src="https://img.shields.io/github/license/OpenAlly/sigyn?style=for-the-badge" alt="license">
  </a>
  <a href="https://github.com/OpenAlly/sigyn">
    <img src="https://img.shields.io/maintenance/yes/2023?style=for-the-badge" alt="maintained">
  </a>
  <a href="https://api.securityscorecards.dev/projects/github.com/OpenAlly/sigyn">
    <img src="https://api.securityscorecards.dev/projects/github.com/OpenAlly/sigyn/badge?style=for-the-badge" alt="ossf scorecard">
  </a>
  <a href="https://github.com/OpenAlly/sigyn">
    <img src="https://img.shields.io/badge/Typescript-294E80.svg?style=for-the-badge&logo=typescript" alt="typescript">
  </a>
  <a href="https://github.com/OpenAlly/sigyn">
    <img src="https://img.shields.io/static/v1?&label=module&message=ESM%20and%20CJS&color=9cf&style=for-the-badge" alt="esm-cjs">
  </a>
</p>

## 🚧 Requirements
- npm v7+ for [workspaces](https://docs.npmjs.com/cli/v7/using-npm/workspaces)

## 📦 Available packages

Click on one of the links to access the documentation of the package:

### Core

| name | package and link |
| --- | --- |
| agent | [@sigyn/agent](./src/agent) |
| config | [@sigyn/config](./src/config) |

### Utils

| name | package and link |
| --- | --- |
| logql | [@sigyn/logql](./src/logql) |
| morphix | [@sigyn/morphix](./src/morphix) |
| pattern | [@sigyn/pattern](./src/pattern) |
| lab | [@sigyn/lab](./src/lab) |

### Notifiers
| name | package and link |
| --- | --- |
| notifiers | [@sigyn/notifiers](./src/notifiers) |
| discord | [@sigyn/discord](./src/discord/) |
| slack | [@sigyn/slack](./src/slack) |
| teams | [@sigyn/teams](./src/teams) |

These packages are available in the Node Package Repository and can be easily installed with [npm](https://docs.npmjs.com/getting-started/what-is-npm) or [yarn](https://yarnpkg.com).

```bash
$ npm i @sigyn/agent
# or
$ yarn add @sigyn/agent
```

## 🔨 Build
To install and compile all workspaces, just run the following commands at the root

```bash
$ npm install
$ npm run build
```

## 🧪 Test
Run test for all workspaces
```bash
npm run test
```

Or running test of a single workspace

```bash
$ npm run test -w <workspace>
```

## 📤 Publishing package
Each package has its own `prepublishOnly` to build TypeScript source before publishing.

```bash
$ npm publish -w <workspace>
```

## Contributors ✨

<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-3-orange.svg?style=flat-square)](#contributors-)
<!-- ALL-CONTRIBUTORS-BADGE:END -->

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/PierreDemailly"><img src="https://avatars.githubusercontent.com/u/39910767?v=4?s=100" width="100px;" alt="PierreDemailly"/><br /><sub><b>PierreDemailly</b></sub></a><br /><a href="https://github.com/OpenAlly/sigyn/commits?author=PierreDemailly" title="Code">💻</a> <a href="https://github.com/OpenAlly/sigyn/commits?author=PierreDemailly" title="Documentation">📖</a> <a href="#maintenance-PierreDemailly" title="Maintenance">🚧</a> <a href="https://github.com/OpenAlly/sigyn/commits?author=PierreDemailly" title="Tests">⚠️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/fraxken"><img src="https://avatars.githubusercontent.com/u/4438263?v=4?s=100" width="100px;" alt="Thomas.G"/><br /><sub><b>Thomas.G</b></sub></a><br /><a href="https://github.com/OpenAlly/sigyn/pulls?q=is%3Apr+reviewed-by%3Afraxken" title="Reviewed Pull Requests">👀</a> <a href="#security-fraxken" title="Security">🛡️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://sofiand.github.io/portfolio-client/"><img src="https://avatars.githubusercontent.com/u/39944043?v=4?s=100" width="100px;" alt="Yefis"/><br /><sub><b>Yefis</b></sub></a><br /><a href="https://github.com/OpenAlly/sigyn/commits?author=SofianD" title="Code">💻</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

## License
MIT
