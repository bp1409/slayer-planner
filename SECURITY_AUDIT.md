# Slayer Planner — Full Pre-Publication Security Audit

Audit date: 2026-11-20  
Repository: `bp1409/slayer-planner`  
Audited checkout: `feature/dev-pages` at `17f5df2`  
Default branch observed remotely: `main` at `ae562cd`  
Published release observed: `v1.2.0` at tag commit `18b0cf6`

## Executive summary

The repository does not contain an obvious credential, private key, API token, password, or other secret in the current tracked tree or in the reachable Git history scanned. The public Sentry DSN present on the default branch and in the v1.2.0 release lineage is a public ingestion identifier, not an authentication secret; it should nevertheless be rate-limited and treated as public.

The project is not ready for another public release without remediation or an explicit risk decision. The largest issue is the Windows wrapper: it executes mutable remote GitHub Pages content inside a native Tauri WebView, uses a broad HTTPS/inline-script CSP, and deliberately changes the page's Tauri-detection state to enable Bazaar networking. This creates a supply-chain and remote-content trust boundary that is materially different from the offline desktop application.

The release process also does not currently provide a complete verifiable chain of custody. The published v1.2.0 release contains assets uploaded by both `github-actions[bot]` and the maintainer account, lacks an updater signing key, and has no visible artifact-attestation or release-signing process. The local wrapper installer is unsigned. GitHub Pages and `dev` deployment are public, while the default branch has no branch protection reported by the GitHub API.

## Overall release readiness: CONDITIONAL (remediation branch; not release-ready)

The application can be released only after the High findings are addressed, or after the owner explicitly accepts the documented risks and limits the release to a clearly labelled beta with no security-sensitive claims. Passing tests and clean npm CVE results do not offset the remote-content wrapper and provenance issues.

## Findings

### High

#### H-01 — Native wrapper executes mutable remote content

Remediation status: Fixed on `feature/security-hardening` for the target `dev` tree. The unsafe wrapper is not tracked on `dev`, the native Tauri app no longer loads mutable Pages content, and the previously published wrapper assets were removed. The untracked local `web-wrapper/` folder is intentionally excluded from this branch and must not be released.

Evidence:

- `web-wrapper/src-tauri/src/main.rs:5` hard-codes `https://bp1409.github.io/slayer-planner/dev/` as the WebView URL.
- `web-wrapper/src-tauri/src/main.rs:24-30` creates a native WebView whose initial page is that external URL and injects JavaScript into it.
- `web-wrapper/src-tauri/tauri.conf.json:10-11` allows `https://` scripts, styles, images, fonts, inline scripts, GitHub Pages, and the Hypixel Bazaar API.
- `web-wrapper/src-tauri/capabilities/default.json:4-6` grants `core:default` to the window.
- `web-wrapper/src-tauri/src/main.rs:9-13` deletes `window.__TAURI__` and sets `allowBazaar` in page storage, intentionally making mutable remote content appear to be the web build.

Impact: a compromise of the Pages deployment, its build inputs, the GitHub account, or a permitted remote dependency could change the code users execute in the native installer. Depending on Tauri's remote-origin IPC enforcement on each platform, that code may also gain access to native capabilities; even without IPC, it can read and change the wrapper's local storage and make permitted network requests. The wrapper is not an offline, reproducible application despite being distributed as a native installer.

Remediation:

1. Prefer bundling a reviewed, immutable frontend into the wrapper. If live pricing is required, call only the exact Bazaar endpoint from bundled code.
2. If remote loading is retained, restrict navigation and remote-origin IPC explicitly, grant the minimum capability set rather than `core:default`, and test that `window.__TAURI_INTERNALS__` and all IPC paths are unavailable to the remote origin.
3. Replace wildcard `https:` CSP sources with exact origins and remove `unsafe-inline` where possible. Add navigation allow-list enforcement and a failure-safe offline mode.
4. Pin the wrapper to a versioned production deployment rather than the mutable `/dev/` path, and publish the exact source commit and hashes used to build it.

#### H-02 — Release artifacts are not fully signed or reproducibly published

Remediation status: Partially fixed. The workflow now checks out the exact tag, verifies the application version and source commit, generates SHA-256 manifests, requests build attestations, and records the source commit in release notes. Signing credentials are not configured, so signed installers remain a release blocker.

Evidence:

- `.github/workflows/release-desktop.yml:73-95`, `:216-236` uploads artifacts to an existing release, but does not sign installers, publish attestations, or publish a checksums manifest.
- The GitHub API reports v1.2.0 assets uploaded by both `github-actions[bot]` and the maintainer account. The wrapper EXE and MSI were uploaded by the maintainer account rather than produced by the release workflow.
- The local wrapper EXE was verified with `Get-AuthenticodeSignature` as `NotSigned`.
- `frontend/src-tauri/tauri.conf.json:29-36` has no configured signing metadata for the desktop bundles.
- GitHub Actions reports `sha_pinning_required: false`, and repository branch protection is reported as absent for `main`.

Impact: users cannot independently verify that every public installer came from the reviewed source and CI build. A compromised maintainer account, release asset, workflow, or local build machine could replace an installer without a cryptographic release signature. GitHub's asset digest is useful for transport integrity but does not establish who built or approved the file.

Remediation: make release builds the only supported publishing path; prohibit manual asset uploads for release tags; enable Windows Authenticode, macOS notarization/signing, and Linux package signing where applicable; publish checksums and GitHub artifact attestations/SLSA provenance; protect release tags and `main`; require review for workflow and release changes; verify the signed artifacts in a clean consumer environment.

#### H-03 — Updater signing is a placeholder and is not release-ready

Remediation status: Fixed safely by removing the updater plugin, placeholder public key, updater endpoint, updater capability, and updater UI. Reintroducing updates requires a separately reviewed signed-update design and valid credentials.

Evidence:

- `frontend/src-tauri/tauri.conf.json:33-36` contains `REPLACE_WITH_TAURI_UPDATER_PUBLIC_KEY` and an updater endpoint for `latest.json`.
- `frontend/src-tauri/src/main.rs:6-10` registers the updater only when `TAURI_UPDATER_PUBLIC_KEY` exists in the build environment.
- `.github/workflows/release-desktop.yml` does not configure or publish a signed updater manifest.
- `README.md:30-36` explicitly says updater signing is not configured.

Impact: the default build has no working signed updater. A build that accidentally supplies the environment variable while leaving the placeholder in configuration can fail verification or ship an unusable update path. Enabling a future updater without a tested key/manifest/asset relationship would create a high-impact supply-chain path.

Remediation: either remove updater configuration until it is ready, or generate a Tauri key pair locally, store only the private key and password in protected GitHub secrets, embed the matching public key, sign every update artifact, publish `latest.json` atomically, and test rollback, downgrade prevention, key mismatch, and interrupted downloads. Never print or commit the private key.

### Medium

#### M-01 — Unsound transitive `glib` dependency is accepted and dismissed

Remediation status: Accepted risk pending owner approval. The current Tauri/GTK dependency chain still reports the glib advisory and unmaintained crates; compatible upgrades were not forced. The exact chain, advisory and mitigation remain documented below.

Evidence:

- `frontend/src-tauri/Cargo.lock:1171-1172` pins `glib 0.18.5`.
- `web-wrapper/src-tauri/Cargo.lock:1113-1114` pins the same version.
- `cargo audit` reported `RUSTSEC-2024-0429` for `glib` as unsound, fixed in `glib >=0.20.0`.
- GitHub Dependabot alert 1 reports `GHSA-wrw7-89jp-8q8g`, severity medium, state dismissed, with the reason `tolerable_risk` because the current GTK/Tauri dependency constraints were considered incompatible with the patched version.

Impact: the advisory describes undefined behaviour and possible null dereference when affected iterator methods are used. The dependency is transitive and primarily relevant to the GTK/Linux stack, but it is present in both lockfiles.

Remediation: upgrade Tauri/Wry/GTK dependencies as a compatible set when available, then rerun Cargo audit and Linux builds. Until then, keep the accepted-risk decision current, monitor the advisory, and do not treat a dismissed Dependabot alert as a clean scan.

#### M-02 — Public Pages deployment consumes an unprotected `dev` branch

Remediation status: Partially fixed. Production and `dev` preview deployments are separate workflows with read-only build permissions and no native-app dependency on `/dev/`. Branch protection and Pages environment restrictions still require manual GitHub configuration.

Evidence:

- `.github/workflows/deploy-web.yml:4-7` deploys on every push to `dev` and on version tags.
- `.github/workflows/deploy-web.yml:26-30` checks out `dev` for the public preview.
- The GitHub API reports the repository is public and `main` is not branch-protected. No protection was observed for `dev` either.
- The public deployment at `https://bp1409.github.io/slayer-planner/dev/` is reachable independently of a release review.

Impact: a write-capable account or compromised workflow can publish unreviewed code to the public preview. The wrapper consumes that mutable preview directly, so this finding compounds H-01.

Remediation: protect `main`, `dev`, and release tags; require reviewed pull requests and successful checks; separate preview and release deployment permissions; deploy the wrapper only from an immutable, reviewed release artifact; consider removing the public dev deployment once no longer needed.

#### M-03 — Sentry privacy controls exist in the default-branch/release lineage but need independent verification

Remediation status: Partially fixed. Consent gating, withdrawal, PII suppression, event-field allowlisting and text/path redaction were strengthened. Sentry dashboard retention, scrubbing and independent production verification remain manual actions.

Evidence at `origin/main`/commit `0331a8a`:

- `frontend/src/lib/sentry.ts:3` contains a Sentry DSN. It is a public ingestion identifier, not a private credential, and its value is intentionally omitted from this report.
- `frontend/src/lib/sentry.ts:8-10` gates initialization on local storage consent.
- `frontend/src/lib/sentry.ts:22-47` removes request, user, breadcrumbs, extra, and contexts and redacts message/stack fields.
- `frontend/src/lib/sentry.ts:50-57` prevents sending events when consent is absent.
- `frontend/src/lib/sentry.ts:60-70` supports consent withdrawal for future events by closing the client.
- `frontend/src/lib/sentry.ts:73-80` sends a user-provided report after consent and truncates it to 4,000 characters.
- `frontend/src/BugReport.tsx:31-36` tells users what is sent and presents the consent control.
- The published v1.2.0 release notes claim opt-in Sentry reporting and anonymous error capture.

Impact: the explicit consent gate is a positive control, but “anonymous” is not established solely by this code. SDK defaults, server-side IP collection, release metadata, event tags/modules/transactions, and future SDK changes require verification. Consent withdrawal cannot retract data already delivered to Sentry. The public DSN can also receive spam unless Sentry-side rate limits and inbound filters are configured.

Remediation: confirm `sendDefaultPii` and SDK integration defaults, configure Sentry data retention, IP handling, rate limits, inbound filters, and deletion procedures; test no network traffic before consent, after withdrawal, and while offline; add regression tests for every event field that can contain user text, URLs, paths, account identifiers, or plan data; update the privacy notice and release wording to avoid unsupported “anonymous” claims.

#### M-04 — Dependabot does not cover the public wrapper

Remediation status: Not applicable on target `dev`: no `web-wrapper/` package or Cargo project is tracked in the branch, and the unsafe wrapper is deliberately excluded. Dependabot continues to cover the tracked frontend and Tauri projects; coverage must be added if a wrapper is intentionally reintroduced.

Evidence: `.github/dependabot.yml:3-9` covers `/frontend` npm and Cargo manifests only. The public `web-wrapper/package.json` and `web-wrapper/src-tauri/Cargo.toml` are omitted.

Impact: wrapper-specific Tauri CLI and Rust dependencies can become stale without automated update pull requests. This matters because the wrapper executes remote content in a native WebView.

Remediation: add npm and Cargo Dependabot entries for `web-wrapper` and require the same verification workflow for wrapper builds.

#### M-05 — Bazaar response size and numeric bounds are not explicitly limited

Remediation status: Fixed in code and regression tests. Bazaar responses now have a 2 MB limit, verified product IDs, bounded finite prices, valid/fresh timestamps and safe cached-price fallback.

Evidence:

- `frontend/src/lib/bazaar.ts:35-39` performs a fetch with an 8-second timeout and immediately parses `response.json()`.
- `frontend/src/lib/bazaar.ts:16-18` accepts any finite non-negative JavaScript number, with no upper bound equivalent to the local price limit.

Impact: a malicious, compromised, or unexpectedly huge API response can consume memory during JSON parsing, and an extremely large price can distort calculations or formatting. The request is sent only to the fixed HTTPS Hypixel endpoint and product IDs are constrained, reducing exploitability.

Remediation: enforce a response `Content-Length`/streaming or byte limit where practical, reject oversized JSON, cap Bazaar prices to a documented range, validate timestamps, and preserve local prices on malformed or suspicious data.

### Low

#### L-01 — No repository license or third-party notices are published

Remediation status: Requires manual action. No project license was selected without owner approval; third-party notice generation and the licensing decision remain release gates.

Evidence: the GitHub API reports `licenseInfo: null`; no `LICENSE`, `NOTICE`, or dependency attribution file is tracked.

Impact: users and redistributors cannot determine the project's license, and bundled components may require notices even though the primary dependencies are generally permissively licensed.

Remediation: choose and publish a project license and add third-party attribution/notices appropriate to the distributed web and native bundles.

#### L-02 — Public Git history exposes maintainer email metadata

Remediation status: Partially fixed/documented. No history was rewritten. Future contributors should configure a GitHub noreply author address; existing public metadata remains unchanged.

Evidence: Git commit metadata includes a personal-looking maintainer email in historical commits. This is public Git metadata, not application data or an authentication secret.

Impact: spam and identity correlation are possible.

Remediation: use a GitHub noreply address for future commits if desired. Rewriting public history is outside this audit and should not be done without an explicit decision.

#### L-03 — Release metadata and source branch are inconsistent

Remediation status: Requires manual action. Existing public release metadata was not modified. Future releases will identify the source commit and publish checksums; historical assets remain independently unverifiable where no build evidence exists.

Evidence: the v1.2.0 release body describes web-only Bazaar pricing, Sentry, and future native installers, while the audited feature branch contains the wrapper and updated wording. The release tag points to `18b0cf6`, not the audited `17f5df2` wrapper commit; v1.2.0 assets include manually uploaded wrapper installers and no macOS assets.

Impact: users may download an asset whose source/configuration is not represented by the release tag or misunderstand which build has Bazaar pricing.

Remediation: create a dedicated wrapper release or retag only after review, update release notes to match exact assets, attach all platform artifacts through CI, and publish source commit/hash mappings.

#### L-04 — No CodeQL configuration or code-scanning results

Remediation status: Fixed in configuration by adding pinned CodeQL JavaScript/TypeScript and Rust workflows for pull requests, `dev`, and weekly scheduled scans. Results still require the GitHub service to execute and be reviewed.

Evidence: the repository has no CodeQL workflow/configuration. GitHub's code-scanning API returned “no analysis found.”

Remediation: add CodeQL or an equivalent SAST scan for TypeScript and Rust, run it on pull requests and protected release branches, and review findings before release.

#### L-05 — Action SHA pinning is present but repository enforcement is disabled

Remediation status: Partially fixed. Existing action SHA pinning and least-privilege workflow permissions were retained or tightened. Repository-level SHA-pinning enforcement, branch protection and required checks remain manual settings.

Evidence: the workflow files pin third-party actions to full commit SHAs, but the GitHub API reports `sha_pinning_required: false` and `allowed_actions: all`.

Impact: future workflow edits can introduce unpinned or unrestricted actions without a repository-level control.

Remediation: enable SHA-pinning enforcement and restrict allowed actions to approved publishers where practical.

## Confirmed strengths and false positives

- No credential-like values, private keys, API keys, access tokens, passwords, Sentry authentication secrets, `.env` files, database dumps, backups, or logs were found in the current scanned files or in 38 commits reachable from local/remote refs using credential-pattern scans. The report does not reproduce any credential-like value.
- The updater placeholder is a deliberate placeholder, not a leaked private key. It still blocks release readiness because the updater is not configured.
- The Sentry DSN is a public client identifier by design, not a secret. It should not be treated as proof that Sentry is private or anonymous.
- `localhost` and `127.0.0.1` occur only in development/test configuration and Playwright tests; no production internal endpoint was identified.
- React rendering is used for user-facing values; no `dangerouslySetInnerHTML`, raw `innerHTML`, `eval`, `new Function`, iframe, or `javascript:` URL pattern was found in the audited source.
- Share imports are bounded to 10,000 characters and use an allow-list, finite-number/boolean checks, tier validation, and calculator validation in `frontend/src/lib/sharing.ts:7-55`.
- Local preferences, workspace, and prices are stored in browser local storage. This is not encrypted and is accessible to other same-origin code, but no account credentials or plan data are sent by the Bazaar request in the audited code.
- The desktop CSP in `frontend/src-tauri/tauri.conf.json` permits only the configured Sentry ingest origin; the updater is removed and Bazaar remains disabled in Tauri.
- `npm audit` reported zero vulnerabilities for the tracked `frontend` project. The prior local wrapper has no tracked manifest/lockfile on `dev`, so wrapper audits are not applicable to this branch. `cargo audit` reports no CVE entries, with the unmaintained/unsound warnings documented above.

## Tests and scans performed

- Enumerated all local and remote branches, tags, tracked files, ignored build output, workflows, package manifests, lockfiles, Tauri configs, source, tests, documentation, and release metadata.
- Scanned current files with credential, private-key, token, DSN, path, email, IP, internal-URL, and secret-file patterns without printing matched values.
- Scanned all 38 commits reachable from local/remote refs and checked Git object reachability with `git fsck --full --no-reflogs --unreachable`; no unreachable objects were reported and no credential-pattern history hits were found.
- Ran `npm audit --audit-level=moderate`: zero vulnerabilities for tracked `frontend`; no wrapper lockfile exists on target `dev`.
- Ran `cargo audit -f frontend/src-tauri/Cargo.lock`: zero known vulnerability entries; warnings include `RUSTSEC-2024-0429` (`glib`), `RUSTSEC-2026-0543` (`chrono` unmaintained), and `RUSTSEC-2024-0370` (`proc-macro-error` unmaintained).
- Ran `npm test`: 43 tests passed.
- Ran `npm run typecheck` and `npm run build`: passed.
- Ran the Playwright workspace suite: 16 tests passed after updating consent copy.
- Ran `cargo check --manifest-path frontend/src-tauri/Cargo.toml`: passed.
- Inspected the public `/slayer-planner/dev/` page in a browser and verified that it is reachable and exposes the Bazaar/profit UI.
- Queried GitHub repository visibility, Pages, branch protection, Actions permissions, workflows, releases, Dependabot alerts, code-scanning status, and secret-scanning status.
- Verified the locally built wrapper Windows EXE is unsigned with PowerShell Authenticode verification.

## Tests not performed

- No dynamic penetration test of the packaged wrapper's WebView navigation, remote-origin IPC, `window.__TAURI_INTERNALS__`, or capability enforcement was performed; this requires running the installer and testing Windows WebView2 behavior with hostile fixture pages.
- No clean-machine installation/uninstallation, SmartScreen reputation, MSI repair/upgrade, or Windows Defender verification was performed.
- No macOS notarization/signature or Linux package installation test was performed.
- No signed updater end-to-end test was possible because the repository has no real updater public/private key and no published signed `latest.json`.
- CodeQL and release attestation workflows were added but cannot be executed locally; GitHub must run and review them. `actionlint`, Gitleaks, Semgrep, Trivy, SBOM generation, malware scan and independent third-party review were not available/configured locally; absence is not a pass.
- No attempt was made to retrieve or reproduce the private Sentry DSN value in this report.

## Required manual verification before release

1. Keep the untracked legacy wrapper out of source/releases; if a wrapper is reintroduced, bundle the frontend and repeat the hostile-page IPC test on Windows.
2. Keep the updater disabled until a signed-update design, valid keys, manifest and end-to-end tests exist.
3. Rebuild all release assets in clean CI from one immutable commit, sign them, generate checksums and attestations, and ensure release uploads are CI-only.
4. Protect `main`, `dev`, and release tags; require reviews and successful security/build checks.
5. Upgrade or formally re-accept the `glib` advisory; add Dependabot coverage if a wrapper is intentionally reintroduced.
6. Verify Sentry consent and withdrawal with network inspection, review server-side retention/IP settings, and remove unsupported anonymity claims.
7. Add a license and third-party notices before distributing native installers.
8. Reconcile the v1.2.0 release notes, tag source, wrapper assets, Pages deployment, and platform coverage.

This report was updated during remediation; source/configuration/workflow changes are documented in `SECURITY_REMEDIATION.md`. No release, tag, merge or history rewrite was performed.
