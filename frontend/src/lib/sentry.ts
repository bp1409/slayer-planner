import * as Sentry from "@sentry/browser";

const DSN = "https://70168c4cd30f9414a9c60314af81104e@o4512464093184000.ingest.de.sentry.io/4512464198697040";
const consentKey = "sentry-consent";
let initialized = false;

export function enabled() { try { return localStorage.getItem(consentKey) === "yes"; } catch { return false; } }

export function sanitizeEvent(event: Sentry.ErrorEvent) {
  const { request: _request, user: _user, breadcrumbs: _breadcrumbs, extra: _extra, contexts: _contexts, ...safe } = event;
  return safe as Sentry.ErrorEvent;
}

export function initSentry() {
  if (initialized || !enabled()) return;
  Sentry.init({
    dsn: DSN,
    maxBreadcrumbs: 0,
    beforeSend: sanitizeEvent,
  });
  initialized = true;
}
export function setEnabled(value: boolean) {
  try { localStorage.setItem(consentKey, value ? "yes" : "no"); } catch { /* storage is optional */ }
  if (value) {
    initSentry();
  } else if (initialized) {
    initialized = false;
    void Sentry.close(2000);
  }
}
export async function sendReport(message: string) {
  if (!enabled()) throw new Error("Consent required");
  if (!message.trim()) throw new Error("Please describe the bug");
  initSentry();
  if (!initialized) throw new Error("Sentry is unavailable in this environment");
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    throw new Error("Sentry could not deliver the report. Check your connection and try again.");
  }
  Sentry.captureFeedback({
    message: message.slice(0, 4000),
    source: "slayer-planner-bug-report",
  });
  if (!await Sentry.flush(5000)) throw new Error("Sentry could not deliver the report. Check your connection and try again.");
}
