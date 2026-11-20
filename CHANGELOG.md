# Changelog

## 1.0.0

- Rebuilt the planner as one responsive workspace with configuration, results, loot, and keyboard-accessible Settings and Help dialogs.
- Set boss XP and quest fees from each Slayer's live quest tiers. Added independent Aatrox controls, observed XP, and input validation.
- Added real XP milestones, target completion feedback, and explicit time and fee estimates.
- Persisted valid plans for each Slayer and added defaults, number and time formats, theme, reduced motion, and reset controls.
- Added calculation and browser tests and lowered the desktop window minimum to 680 × 520.
- Added quest access checks and opt-in future-tier estimates. Verified the quest and loot data against the live game references.
- Blocked WebView network requests in production, sanitized build-machine paths in release binaries, and limited release-write permissions to the Linux publishing job.

## 1.1.0

- Rewrote the repository front door with download, web, screenshot, contribution, and offline-use guidance.
- Added suggested GitHub repository topics.

## 1.2.0

- Extended the guarded release workflow with signed-artifact-ready x64 and arm64 macOS build/publish jobs.
- macOS publishing preserves tag-moved checks and fails on duplicate release assets.

## 1.3.0

- Added Discord-ready plan summaries and compact versioned JSON export/import.
- Added strict import validation and tests for malformed, oversized, and malicious input.

## 1.4.0

- Added a game-data verification label sourced from the dated audit and an opt-in, disabled-by-default Tauri updater plugin.
- Documented updater signing setup and proposed web-only online features without implementing them.
