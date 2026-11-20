# Security remediation

This branch remediates the audited `dev` tree without publishing a release, changing tags, or rewriting history.

## Finding status

| Finding | Status | Notes |
| --- | --- | --- |
| H-01 remote-content wrapper | Fixed | The tracked `dev` tree contains no wrapper; the native app no longer loads mutable Pages content. The untracked local wrapper is excluded. |
| H-02 artifact integrity | Partially fixed | Exact-tag builds, version/source checks, SHA-256 manifests and provenance attestations are configured. Signing is unavailable and blocks release. |
| H-03 updater | Fixed safely | Unsigned/placeholder updater code, capability, endpoint and UI were removed. |
| M-01 glib advisory | Accepted risk pending approval | The current Tauri/GTK chain still reports the advisory; no incompatible upgrade was forced. |
| M-02 Pages preview | Partially fixed | Production and preview workflows are separate and native code does not consume `/dev/`; branch and environment protection are manual. |
| M-03 Sentry | Partially fixed | Consent, withdrawal, PII suppression and event sanitisation were strengthened; dashboard settings require manual verification. |
| M-04 Dependabot | Not applicable on target tree | `web-wrapper/` is not tracked on `dev`; tracked frontend and Cargo projects remain covered. |
| M-05 Bazaar validation | Fixed | Response size, timestamps, product IDs, numeric bounds and cache fallback are validated and tested. |
| L-01 licensing | Requires manual action | Owner must choose a project license and approve third-party notices. |
| L-02 Git author privacy | Partially fixed | No history rewrite; future commits should use a GitHub noreply address. |
| L-03 release metadata | Requires manual action | Existing releases were not changed; future workflow records source commits and checksums. |
| L-04 CodeQL | Fixed in configuration | Pinned JavaScript/TypeScript and Rust workflows added; GitHub execution and review remain required. |
| L-05 Actions restrictions | Partially fixed | Full SHA pins and least-privilege permissions are retained/tightened; repository enforcement is manual. |

## Security improvements

- Removed the placeholder Tauri updater and its privileged capability.
- Added Bazaar response limits, strict product validation, timestamp freshness and safe stale-cache handling.
- Strengthened Sentry consent and event sanitisation and documented the privacy model in [`PRIVACY.md`](./PRIVACY.md).
- Separated production Pages deployment from the `dev` preview deployment.
- Added release source-commit checks, SHA-256 manifests and build-provenance attestations.
- Added pinned CodeQL workflows for JavaScript/TypeScript and Rust.

## Remaining vulnerabilities and blockers

- The glib advisory remains in the Tauri dependency chain and requires owner risk acceptance or a compatible upstream upgrade.
- Installers are not signed because no valid signing credentials were available. Do not publish until signing and verification are configured.
- No updater is shipped. Any future updater requires signed artifacts, a verified manifest and a reviewed key-management process.
- Project licensing, Sentry dashboard controls, branch protection and Pages environment restrictions require owner action.

## Required GitHub settings

Enable branch protection for `dev` and `main`, require the relevant verification and CodeQL checks, require pull requests and prevent force-push/deletion. Require SHA-pinned actions at the organization or repository level, restrict Pages deployment to the intended environments, and limit release publishing to trusted maintainers. Review Dependabot and secret-scanning alerts regularly.

## Signing requirements

Configure platform signing credentials only in protected GitHub environments/secrets, never in source. Verify the generated installer signatures independently before publishing. Until then, the release workflow must remain blocked for public installers.

## Sentry configuration requirements

Set retention, inbound filtering, rate limits, data scrubbing and deletion policies in the Sentry dashboard. Verify that IP/user enrichment is disabled and that test events are not retained beyond the project policy. Confirm consent, withdrawal, offline and redaction behavior against a production build.

## Manual verification checklist

- [ ] Review and accept or remediate the glib advisory.
- [ ] Choose a project license and generate/approve third-party notices.
- [ ] Configure protected GitHub environments, branch rules and required checks.
- [ ] Configure valid platform signing credentials and independently verify signatures.
- [ ] Run the release workflow from a test tag and verify source commit, checksums and attestations.
- [ ] Verify Sentry dashboard privacy settings and consent/withdrawal behavior.
- [ ] Review the CodeQL results and all dependency alerts before release.
