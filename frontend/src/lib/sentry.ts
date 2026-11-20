import * as Sentry from "@sentry/browser";

const DSN = "https://70168c4cd30f9414a9c60314af81104e@o4512464093184000.ingest.de.sentry.io/4512464198697040";
const consentKey = "sentry-consent";
let initialized = false;
let closing: Promise<unknown> | undefined;

export function enabled() {
  try { return localStorage.getItem(consentKey) === "yes"; } catch { return false; }
}

export function redactSensitiveText(value: string) {
  return value
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [redacted]")
    .replace(/(password|passwd|token|secret|api[_-]?key)\s*[:=]\s*[^\s,;]+/gi, "$1=[redacted]")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[redacted-email]")
    .replace(/https?:\/\/[^\s)]+/gi, "[redacted-url]")
    .replace(/(?:[A-Za-z]:\\|\/)(?:[^\s\\/]+[\\/])*[^\s\\/]*/g, "[redacted-path]");
}

export function sanitizeEvent(event: Sentry.ErrorEvent) {
  const safe = { ...event };
  delete safe.request;
  delete safe.user;
  delete safe.breadcrumbs;
  delete safe.extra;
  delete safe.contexts;
  if (safe.message) safe.message = redactSensitiveText(safe.message);
  if (safe.exception?.values) {
    safe.exception = {
      ...safe.exception,
      values: safe.exception.values.map((value) => ({
        ...value,
        value: value.value ? redactSensitiveText(value.value) : value.value,
        stacktrace: value.stacktrace ? {
          ...value.stacktrace,
          frames: value.stacktrace.frames?.map((frame) => ({
            ...frame,
            filename: frame.filename ? redactSensitiveText(frame.filename) : frame.filename,
            function: frame.function ? redactSensitiveText(frame.function) : frame.function,
          })),
        } : value.stacktrace,
      })),
    };
  }
  return safe as Sentry.ErrorEvent;
}

function beforeSend(event: Sentry.ErrorEvent) {
  return enabled() ? sanitizeEvent(event) : null;
}

export function initSentry() {
  if (initialized || closing || !enabled()) return;
  Sentry.init({ dsn: DSN, maxBreadcrumbs: 0, beforeSend });
  initialized = true;
}

export function setEnabled(value: boolean) {
  try { localStorage.setItem(consentKey, value ? "yes" : "no"); } catch { /* storage is optional */ }
  if (value) {
    initSentry();
  } else if (initialized) {
    initialized = false;
    closing = Sentry.close(0).finally(() => {
      closing = undefined;
      if (enabled()) initSentry();
    });
  }
}

export async function sendReport(message: string) {
  if (!enabled()) throw new Error("Consent required");
  if (!message.trim()) throw new Error("Please describe the bug");
  initSentry();
  if (!initialized) throw new Error("Sentry is unavailable while consent changes are being applied");
  if (typeof navigator !== "undefined" && !navigator.onLine) throw new Error("Sentry could not deliver the report. Check your connection and try again.");
  Sentry.captureFeedback({ message: redactSensitiveText(message.slice(0, 4000)), source: "slayer-planner-bug-report" });
  if (!await Sentry.flush(5000) || !enabled()) throw new Error("Sentry could not deliver the report. Check your connection and try again.");
}
