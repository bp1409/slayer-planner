# Slayer Planner

An offline Hypixel SkyBlock Slayer planner for mapping XP, quest access, time, cost, and loot before you start grinding.

![Slayer Planner desktop screenshot](docs/screenshots/planner-default.png)

The image is a placeholder. Capture and save these screenshots exactly here:

- `docs/screenshots/planner-default.png` — desktop planner at 1160×760 with Zombie selected and the default settings.
- `docs/screenshots/planner-future-tier.png` — planner showing the explicit future-tier estimate/access confirmation state.
- `docs/screenshots/planner-loot-audit.png` — planner scrolled to the loot reference with a visible source-discrepancy note.
- `docs/screenshots/planner-web-mobile.png` — deployed web version in a narrow mobile viewport.

## Download and use

- [Download the latest desktop release](https://github.com/bp1409/slayer-planner/releases/latest)
- [Open the web version](https://bp1409.github.io/slayer-planner/)

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

Updater signing is not configured in this repository yet. Before publishing updater-enabled builds, generate a Tauri updater key pair locally, keep the private key and password in GitHub Actions secrets, put only the public key in `frontend/src-tauri/tauri.conf.json`, and publish the signed `latest.json` plus matching assets. The updater setting is off by default.

## Contributing

Use Node.js 22.18 or newer, then run `npm ci` and `npm run dev` in [`frontend/`](frontend/). Before opening a pull request, run `npm test`, `npm run typecheck`, `npm run build`, and `npm run test:e2e`. Preserve the offline desktop boundary, design tokens, keyboard accessibility, reduced-motion behavior, and calculator tests.

Game-data changes require a dated source or an explicit discrepancy note in [`frontend/GAME-DATA.md`](frontend/GAME-DATA.md). See [`frontend/README.md`](frontend/README.md) for desktop prerequisites.

See [`docs/online-features.md`](docs/online-features.md) for the proposed web-only profit-pricing and username-import design. Those features are not implemented.
