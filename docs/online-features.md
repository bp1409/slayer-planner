# Optional online features (proposal)

The current profit panel uses user-entered local prices and bundled base loot rates. The approved Bazaar refresh is web-only and opt-in: it fetches sell prices only for product IDs the user explicitly enters, keeps local prices as fallback, and stores the timestamp locally. Bazaar values remain approximate and outside the audited game-data model and `src/lib/calculator.ts`. Auction House fetching and Hypixel username import are not implemented.

They should be web-only opt-in features. The desktop build must retain `connect-src 'none'`, ship no online-feature client code, and never require an account, API key, telemetry, or a network connection for local planning. The web UI should show when online mode is enabled, explain what leaves the browser, and provide an offline switch.

The Bazaar module uses an explicit web-only setting, an 8-second timeout, source/timestamp display, and a clear fallback to the local table. It never sends plans or account data. The Tauri CSP remains `connect-src 'none'`; the Bazaar control is hidden in Tauri and no refresh is attempted there.

For a later opt-in web-only price refresh, prefer the same isolated module and a documented source contract. Add a visible source URL, response freshness, retry/backoff and an offline switch; never proxy desktop traffic or silently replace local values.

Username import should require explicit consent, validate every returned field against the existing Slayer schema, avoid persistent storage of usernames/profile data/API keys, and show the exact fields before applying them. Decide the service, rate limits, privacy policy, failure UX, and Hypixel terms compliance before implementation.
