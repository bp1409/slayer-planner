# Changelog

## 1.1.0

- Added a GitHub Pages-ready static web build with a PWA manifest, versioned offline service worker, and tag-triggered deployment.
- Added responsive planner, keyboard-accessible Settings and Help dialogs, reduced-motion support, and persistent local plans and preferences.
- Added audited Slayer quest, XP, loot, access, milestone, Aatrox, observed-XP, and validation behavior without changing calculator independence from React.
- Added Discord-ready plan summaries and compact versioned JSON export/import with strict validation for malformed, oversized, and malicious input.
- Added game-data verification status sourced from the dated audit.
- Added guarded Linux, macOS, and Windows desktop release jobs with tag-moved checks and duplicate-asset protection.
- Added an opt-in, disabled-by-default updater registration path and documented signing setup.
- Added an offline approximate coins-per-hour view with locally saved per-drop prices; Magic Find and RNG Meter effects are excluded.
- Rewrote the repository front door with download, web, screenshot, contribution, offline-use, and topic guidance.
- Documented proposed web-only online features without implementing network access.
- Added an opt-in web-only Bazaar sell-price refresh with verified product-ID mapping and local-price fallback. The desktop build remains offline.
- Added a GitHub Pages preview for the `dev` branch at `/slayer-planner/dev/`.

## 1.0.0

- Rebuilt the planner as one responsive workspace with configuration, results, loot, and keyboard-accessible Settings and Help dialogs.
- Set boss XP and quest fees from each Slayer's live quest tiers. Added independent Aatrox controls, observed XP, and input validation.
- Added real XP milestones, target completion feedback, and explicit time and fee estimates.
- Persisted valid plans for each Slayer and added defaults, number and time formats, theme, reduced motion, and reset controls.
- Added calculation and browser tests and lowered the desktop window minimum to 680 × 520.
- Added quest access checks and opt-in future-tier estimates. Verified the quest and loot data against the live game references.
- Blocked WebView network requests in production, sanitized build-machine paths in release binaries, and limited release-write permissions to publishing jobs.
