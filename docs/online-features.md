# Optional online features (proposal)

Profit-per-hour pricing and Hypixel username import are intentionally not implemented. Approval is required before adding either feature.

They should be web-only opt-in features. The desktop build must retain `connect-src 'none'`, ship no online-feature client code, and never require an account, API key, telemetry, or a network connection for local planning. The web UI should show when online mode is enabled, explain what leaves the browser, and provide an offline switch.

Profit-per-hour should use only a user-entered price table or a documented, explicitly selected source. Prices must be timestamped and approximate; guessed values must not enter the audited game-data model. Keep this logic outside `src/lib/calculator.ts`.

Username import should require explicit consent, validate every returned field against the existing Slayer schema, avoid persistent storage of usernames/profile data/API keys, and show the exact fields before applying them. Decide the service, rate limits, privacy policy, failure UX, and Hypixel terms compliance before implementation.
