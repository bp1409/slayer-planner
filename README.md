# Slayer Planner

Offline Hypixel SkyBlock Slayer XP planner built with React, TypeScript, Radix UI, and Tauri.

The calculator needs no account or API key. Plans and preferences are stored locally on the device. Loot links point to public game-data sources.

## Development

```bash
cd frontend
npm ci
npm run dev
```

## Desktop build

```bash
cd frontend
npm run tauri:build
```

See the [frontend guide](./frontend/README.md) for platform prerequisites, test commands, and sources for the game data.
