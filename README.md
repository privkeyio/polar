# Polar with BLAKE2b proof of work

This is an unofficial fork of [Polar](https://github.com/jamaljsr/polar) that follows Bitcoin's change of proof-of-work algorithm to BLAKE2b. It is not affiliated with the Polar project. Upstream Polar has not adopted the change, so use it instead if that is what you want.

> **For regtest only, and not audited. Use at your own risk, and no warranty of any kind, see the [MIT license](LICENSE).** Everything below the divider is upstream's documentation and describes Polar rather than this fork.

## What differs from Polar

- **Bitcoin Knots.** The Bitcoin node is Bitcoin Knots, started with `-testactivationheight=blake2b@1`, so every block past the genesis block has the 164 byte v2 header and its BLAKE2b hash as the block id.
- **Lightning nodes that follow BLAKE2b.** LND is [paulscode/lightning-fork](https://github.com/paulscode/lightning-fork) and Core Lightning is [privkeyio/lightning](https://github.com/privkeyio/lightning). Both sign channels with the unified opt-in signature hash and advertise `option_blake2b`, so they peer with each other and not with Lightning nodes on the SHA256d rules.
- **Removed:** Bitcoin Core, Eclair, Taproot Assets and Lightning Terminal, which do not follow BLAKE2b.
- **Images** are published to `ghcr.io/privkeyio/polar` from the Dockerfiles in [docker](docker), and the image list is fetched from this repository rather than upstream's.
- **Separate data directory.** Networks, settings and logs live in `~/.polar-blake2b` (or `~/.local/share/polar-blake2b`), so it installs alongside upstream Polar without sharing networks. Do not run both at once: they use the same container names and host ports. Networks made with upstream Polar have SHA256d blocks; create new ones here.
- **Knots policy.** Bitcoin Knots also runs with `-rejectparasites=0`, so a Core Lightning wallet transaction is not refused for a locktime that policy reads as a parasite.

## Releases

Published under [Releases](https://github.com/privkeyio/polar/releases) with a signed shasums file covering every artifact:

```bash
gpg --verify polar-*-shasums.txt.asc polar-*-shasums.txt
sha256sum -c polar-*-shasums.txt --ignore-missing
```

The signing key is `A47D 99B6 DB0D 715D 40C5 9A20 23AE 8A8E A7E2 4E38`.

---

# Polar

> One-click Bitcoin Lightning networks for local app development & testing

[![Actions Status](https://github.com/jamaljsr/polar/workflows/CI/badge.svg)](https://github.com/jamaljsr/polar/actions)
[![codecov](https://codecov.io/gh/jamaljsr/polar/branch/master/graph/badge.svg)](https://codecov.io/gh/jamaljsr/polar)
[![Crowdin](https://badges.crowdin.net/polar/localized.svg)](https://crowdin.com/project/polar)
[![GitHub license](https://img.shields.io/github/license/jamaljsr/polar.svg)](https://github.com/jamaljsr/polar/blob/master/LICENSE)
[![GitHub release](https://img.shields.io/github/release/jamaljsr/polar.svg)](https://GitHub.com/jamaljsr/polar/releases/)

<p align="center">
  <img src="./assets/screen.png" />
  <a href="https://youtu.be/mb37durvPns" target="_blank">
    View a short video demo
  </a>
</p>

## Purpose

Polar was built to help Lightning Network application developers quickly spin up one or more networks locally on their computers.

With Polar you can:

- Create a regtest Lightning Network in just a few clicks
- Connect from your app to the lightning nodes via RPC
- Add more nodes using drag & drop
- Start and stop individual nodes
- Open & Close Channels
- Create & Pay Lightning Invoices
- Launch a terminal in each bitcoin/lightning node
- View streaming logs from each node
- Manually mine new blocks
- Deposit regtest coins into each Lightning node
- Export and import networks, for sharing with other Lightning developers
- Create you own docker images to use as [custom nodes](https://github.com/jamaljsr/polar/blob/master/docs/custom-nodes.md) (ex: master branch, local fork)

Supported Network Node Versions:

- [LND](https://github.com/lightningnetwork/lnd) - v0.20.0, v0.19.3, v0.19.2, v0.19.1, v0.18.5, v0.18.4, v0.18.3, v0.17.5, v0.16.4
- [Core Lightning](https://github.com/ElementsProject/lightning) - v25.12, v25.09.3, v25.05, v25.02, v24.11.1, v24.08.1
- [Bitcoin Core](https://github.com/bitcoin/bitcoin) - v30.0, v29.0, v28.0, v27.0, v26.0

### MCP (Model Context Protocol)

Polar includes an MCP server that enables AI agents like Claude & Cursor to programmatically control Lightning Network simulations.

See the [polar-mcp](https://github.com/jamaljsr/polar-mcp) repo for installation instructions.

See the [MCP Architecture Documentation](docs/mcp-architecture.md) for technical information on the architecture, API, and how to add new tools to Polar.

## Dependencies

Polar requires that you have Docker installed to create the local networks

- On Mac & Windows, you can just install [Docker Desktop](https://www.docker.com/products/docker-desktop)
- On Linux, you need to install [Docker Server](https://docs.docker.com/engine/install/#server).

You will be prompted to install Docker if Polar cannot detect it automatically

⚠️ **Important Docker Notes**

- On Linux, Docker Desktop is currently not supported due to a significant change in how it handles file sharing between host and container (See [#636](https://github.com/jamaljsr/polar/issues/636#issuecomment-1450201391))

## Download

Download Polar v4.0.0 for your OS

- Mac ([dmg](https://github.com/jamaljsr/polar/releases/download/v4.0.0/polar-mac-x64-v4.0.0.dmg))
- Linux ([deb](https://github.com/jamaljsr/polar/releases/download/v4.0.0/polar-linux-amd64-v4.0.0.deb), [AppImage](https://github.com/jamaljsr/polar/releases/download/v4.0.0/polar-linux-x86_64-v4.0.0.AppImage), [RPM](https://github.com/jamaljsr/polar/releases/download/v4.0.0/polar-linux-x86_64-v4.0.0.rpm))
- Windows ([exe](https://github.com/jamaljsr/polar/releases/download/v4.0.0/polar-win-x64-v4.0.0.exe))

Alternative and older version binaries can be found in the [GitHub releases](https://github.com/jamaljsr/polar/releases)

## Help Translate

Polar's translations are managed on [Crowdin](https://crowdin.com/project/polar). The initial translations of 10 languages were done by machine (Google Translate) and are likely to not be 100% accurate. If you speak multiple languages and wish to help with translations, please feel free to head over to the [project page](https://crowdin.com/project/polar) on Crowdin and submit updated strings. This assistance would be greatly appreciated.

## Development

If you would like to learn how to package Polar from source code or want to fix a bug or add a new feature, please see [CONTRIBUTING](https://github.com/jamaljsr/polar/blob/master/CONTRIBUTING.md) for detailed instructions.

### Commands

| Command         | Description                                                       |
| --------------- | ----------------------------------------------------------------- |
| `yarn`          | install dependencies                                              |
| `yarn dev`      | run the app with react hot reloading and electron live restarting |
| `yarn test`     | run unit tests in watch mode                                      |
| `yarn test:e2e` | run e2e tests                                                     |
| `yarn lint:all` | run typescript and eslint syntax checking                         |
| `yarn package`  | package the app for your OS                                       |

### Tech Stack

- [Node.js](https://nodejs.org/en): nodejs version >= 20
- [Electron](https://github.com/electron/electron/): cross platform desktop app framework
- [Typescript](https://github.com/microsoft/TypeScript): increased productivity with a typed language
- [ReactJS](https://github.com/facebook/react/): declarative UI library for JavaScript
- [Create React App](https://github.com/facebook/create-react-app): minimize build configuration
- [easy-peasy](https://github.com/ctrlplusb/easy-peasy): Redux state management without the boilerplate
- [Emotion](https://emotion.sh/): simplified CSS style composition
- [Ant Design](https://github.com/ant-design/ant-design/): don't reinvent the wheel with UI design
- [react-i18next](https://github.com/i18next/react-i18next): support for multiple languages (english/spanish included)
- [electron-log](https://github.com/megahertz/electron-log): multi-level logging to console and file
- [Prettier](https://github.com/prettier/prettier): keep code format consistent
- [ESLint](https://github.com/eslint/eslint): follow code quality best practices
- [Github Actions](https://github.com/actions): automate builds and testing on Windows/Mac/Linux
- [Renovate Bot](https://github.com/renovatebot/renovate): automate dependency upgrades via GitHub bot
- [Jest](https://github.com/facebook/jest): delightful JavaScript testing
- [React Testing Library](https://github.com/testing-library/react-testing-library): React specific testing utilities
- [CodeCov](https://codecov.io/): maintain quality of unit tests
- [Testcafe](https://github.com/DevExpress/testcafe): End-to-end is important
- [commitlint](https://github.com/conventional-changelog/commitlint): standardize git commit messages
- [standard-version](https://github.com/conventional-changelog/commitlint): automate release versioning and changelog generation
