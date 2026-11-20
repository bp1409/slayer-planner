# Optional online features (proposal)

The profit panel uses audited base loot rates, quest fees and locally saved spawn and kill times. Bazaar refresh is web-only and opt-in. Drop mappings were checked on 20 November 2026 against the [Hypixel item catalog](https://api.hypixel.net/v2/resources/skyblock/items) and the [Bazaar product list](https://api.hypixel.net/v2/skyblock/bazaar). Local prices override Bazaar values. Drops without verified mappings can be priced manually. Auction House fetching and username import are outside the profit calculator.

They should be web-only opt-in features. The desktop build must retain `connect-src 'none'`, ship no online-feature client code, and never require an account, API key, telemetry, or a network connection for local planning. The web UI should show when online mode is enabled, explain what leaves the browser, and provide an offline switch.

The Bazaar module uses an explicit web-only setting, an 8-second timeout, source/timestamp display, and a clear fallback to the local table. It never sends plans or account data. The Tauri CSP remains `connect-src 'none'`; the Bazaar control is hidden in Tauri and no refresh is attempted there.

For a later opt-in web-only price refresh, prefer the same isolated module and a documented source contract. Add a visible source URL, response freshness, retry/backoff and an offline switch; never proxy desktop traffic or silently replace local values.

Username import should require explicit consent, validate every returned field against the existing Slayer schema, avoid persistent storage of usernames/profile data/API keys, and show the exact fields before applying them. Decide the service, rate limits, privacy policy, failure UX, and Hypixel terms compliance before implementation.
