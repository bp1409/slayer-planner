# Slayer Planner

An offline Hypixel SkyBlock Slayer calculator for Windows, macOS, Linux, and the web. The app stores preferences and the last valid plan for each Slayer locally.

## Run the workspace

Use Node.js 22.18 or newer.

```sh
cd frontend
npm ci
npm run dev
```

Open the URL Vite prints. For the production browser preview, run `npm run build` and then `npm run preview`.

## Test and build

```sh
npm test
npm run typecheck
npm run build
npx playwright install chromium
npm run test:e2e
```

Set `PLAYWRIGHT_CHANNEL=msedge` to run browser tests in an installed Edge instead. Linux test hosts may need `npx playwright install --with-deps chromium`.

Install the [Tauri platform prerequisites](https://v2.tauri.app/start/prerequisites/) before using `npm run tauri:dev` or `npm run tauri:build`. The latter produces NSIS/MSI bundles on Windows, DMG bundles on macOS, and deb/AppImage bundles on Linux under `src-tauri/target/release/bundle/`. The verification workflow compiles without installers. The desktop release workflow builds each platform from an explicit version tag and uploads to its existing release. It fails if the tag moved during the build or if assets with those names already exist.

## Game data

The [game-data audit](GAME-DATA.md) records sources, verification dates and discrepancies for the live quest model and bundled loot tables.

Calculation and validation are independent of React in `src/lib/calculator.ts`. Shared visual tokens live in `src/styles/tokens.css`.

The static web build uses `/slayer-planner/` as its GitHub Pages base path and `/` locally. It includes a versioned service worker that precaches the production asset list and can serve the app offline after its first load. Service-worker registration is skipped inside Tauri. Run `npm test`, `npm run typecheck`, `npm run build`, and `npm run test:e2e` before submitting changes.

The planner includes local plan sharing with validated JSON import/export and Discord-ready summaries, and shows the audit date for the bundled game data. The updater plugin is registered only when a build provides the real `TAURI_UPDATER_PUBLIC_KEY` environment variable; the default desktop build has no updater registration. If enabled, it remains disabled in the UI until the user turns on **Check for updates** and a real signing key is configured.

The Profit view accepts approximate per-drop prices locally, saves them in browser/app storage, and reports expected coins per hour from bundled base loot rates and the selected seconds per boss. On the web only, the optional Bazaar refresh matches prices automatically to the bundled drop table. Magic Find and RNG Meter effects are not included; Auction House fetching and username import are not included.
