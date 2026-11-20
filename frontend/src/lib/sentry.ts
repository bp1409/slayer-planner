import * as Sentry from "@sentry/browser";
import { isTauri } from "./platform";

const DSN = "https://70168c4cd30f9414a9c60314af81104e@o4512464093184000.ingest.de.sentry.io/4512464198697040";
const consentKey = "sentry-consent";
let initialized = false;

export function enabled() { try { return localStorage.getItem(consentKey) === "yes"; } catch { return false; } }
export function initSentry() {
  if (initialized || !enabled() || isTauri()) return;
  Sentry.init({ dsn: DSN });
  initialized = true;
}
export function setEnabled(value: boolean) {
  try { localStorage.setItem(consentKey, value ? "yes" : "no"); } catch { /* storage is optional */ }
  if (value) initSentry();
}
export function sendReport(message: string) {
  if (!enabled()) throw new Error("Consent required");
  if (!message.trim()) throw new Error("Please describe the bug");
  initSentry();
  if (!initialized) throw new Error("Sentry is unavailable in this environment");
  Sentry.captureFeedback({
    message: message.slice(0, 4000),
    source: "slayer-planner-bug-report",
    url: typeof window === "undefined" ? undefined : window.location.href,
  });
}
