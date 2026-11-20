# Privacy notice

Slayer Planner stores planner settings, plans and manual prices locally in the browser or desktop application. They are not sent to the project maintainers.

## Optional Sentry reports

Sentry is disabled until the user explicitly enables bug-report consent. With consent enabled, the application may send an error event or a user-written bug report to the configured Sentry project. With consent withdrawn, future events and reports are stopped; withdrawal cannot retract an event already delivered.

Events do not include saved plans, local storage, request objects, users, breadcrumbs, tags, URLs, paths, module names, release identifiers or other arbitrary context. Report text is length-limited and redacted for common credentials, email addresses, URLs and local paths. Sentry's delivery infrastructure may still process network metadata such as an IP address; `sendDefaultPii` is disabled in code.

Bug reports require a separate explicit consent checkbox. Reports contain the submitted description and limited fixed application context. Reports cannot be sent while offline. The “Copy bug report” action does not contact Sentry.

## Bazaar pricing

When enabled in the web application, Bazaar requests go only to the fixed Hypixel endpoint and contain product identifiers, not plans or account information. The offline desktop application does not connect for Bazaar pricing.

## Operator configuration

The Sentry project owner must independently configure data scrubbing, retention, inbound filters, rate limits and deletion handling in the Sentry dashboard. Those settings cannot be verified from this repository.
