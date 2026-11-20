# Optional online features (proposal)

Online price fetching and Hypixel username import are intentionally not implemented. The current profit panel is the approved no-network portion: it uses only user-entered local prices and bundled base loot rates. Approval is required before adding network access.

They should be web-only opt-in features. The desktop build must retain `connect-src 'none'`, ship no online-feature client code, and never require an account, API key, telemetry, or a network connection for local planning. The web UI should show when online mode is enabled, explain what leaves the browser, and provide an offline switch.

For a later opt-in web-only price refresh, use a separate browser-only module with an explicit Online prices setting, visible online/offline status, request timeout, source/timestamp display, and a clear fallback to the local table. Never load that module in Tauri, never send plans or account data, and keep fetched prices timestamped and approximate outside the audited game-data model and `src/lib/calculator.ts`. This design requires approval before implementation.

Username import should require explicit consent, validate every returned field against the existing Slayer schema, avoid persistent storage of usernames/profile data/API keys, and show the exact fields before applying them. Decide the service, rate limits, privacy policy, failure UX, and Hypixel terms compliance before implementation.
