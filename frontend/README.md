# Slayer Planner

An offline Hypixel SkyBlock Slayer calculator for Windows and Linux. The app stores preferences and the last valid plan for each Slayer locally.

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

Install the [Tauri platform prerequisites](https://v2.tauri.app/start/prerequisites/) before using `npm run tauri:dev` or `npm run tauri:build`. The latter produces NSIS/MSI bundles on Windows and deb/AppImage bundles on Linux under `src-tauri/target/release/bundle/`. The verification workflow compiles without installers. The Linux release workflow builds from an explicit version tag and uploads to its existing release. It fails if the tag moved during the build or if assets with those names already exist.

## Game data

The [game-data audit](GAME-DATA.md) records sources, verification dates and discrepancies for the live quest model and bundled loot tables.

Calculation and validation are independent of React in `src/lib/calculator.ts`. Shared visual tokens live in `src/styles/tokens.css`.
