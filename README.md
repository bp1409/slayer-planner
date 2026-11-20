# Slayer Planner

An offline Hypixel SkyBlock Slayer planner for mapping XP, quest access, time, cost, and loot before you start grinding.

![Slayer Planner desktop screenshot](docs/screenshots/planner-default.png)

More views: [future-tier estimate](docs/screenshots/planner-future-tier.png), [loot audit](docs/screenshots/planner-loot-audit.png), and [mobile web version](docs/screenshots/planner-web-mobile.png).

## Download and use

- [Download the latest desktop release](https://github.com/bp1409/slayer-planner/releases/latest)
- [Open the web version](https://bp1409.github.io/slayer-planner/)
- [Open the dev web preview](https://bp1409.github.io/slayer-planner/dev/)

The web version is static and works offline after its first load. Production desktop builds block WebView network requests. Plans, preferences, and the last valid workspace are stored locally.

## Why use it

- No account required.
- No API key required.
- Works offline.
- Uses an audited game-data model with dated sources and discrepancy notes in [`frontend/GAME-DATA.md`](frontend/GAME-DATA.md).
- Keeps calculation and validation independent from React.
- Includes explicit access checks instead of silently assuming future-tier unlocks.

## macOS note

The macOS app is unsigned. If Gatekeeper blocks it, Control-click the app in Finder, choose **Open**, then confirm **Open**. You may need to repeat this after downloading a newer build.

Automatic updates are intentionally disabled. A future updater must be designed, signed and tested end-to-end before it is added.

## Contributing

Use Node.js 22.18 or newer, then run `npm ci` and `npm run dev` in [`frontend/`](frontend/). Before opening a pull request, run `npm test`, `npm run typecheck`, `npm run build`, and `npm run test:e2e`. Preserve the offline desktop boundary, design tokens, keyboard accessibility, reduced-motion behavior, and calculator tests.

Game-data changes require a dated source or an explicit discrepancy note in [`frontend/GAME-DATA.md`](frontend/GAME-DATA.md). See [`frontend/README.md`](frontend/README.md) for desktop prerequisites.

The offline Profit view is implemented with user-entered approximate prices. The web build also offers an opt-in Bazaar sell-price refresh matched automatically to the bundled drop table; the desktop build remains offline. See [`docs/online-features.md`](docs/online-features.md) for the boundaries and future online-feature design. Auction House fetching and username import are not implemented.
