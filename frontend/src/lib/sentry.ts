const DSN = "https://70168c4cd30f9414a9c60314af81104e@o4512464093184000.ingest.de.sentry.io/4512464198697040";
const url = new URL(DSN);
const endpoint = `${url.origin}/api/${url.pathname.slice(1)}/envelope/`;
export function enabled() { return localStorage.getItem("sentry-consent") === "yes"; }
export function setEnabled(value: boolean) { localStorage.setItem("sentry-consent", value ? "yes" : "no"); }
export async function sendReport(message: string) {
  if (!enabled()) throw new Error("Consent required");
  if (!message.trim()) throw new Error("Please describe the bug");
  const event_id = crypto.randomUUID().replaceAll("-", "");
  const event = { event_id, timestamp: new Date().toISOString(), platform: "javascript", level: "error", release: "slayer-planner@1.1.0", message: message.slice(0,4000), tags: { origin: "user-report" } };
  const body = [JSON.stringify({event_id,dsn:DSN}), JSON.stringify({type:"event"}),JSON.stringify(event)].join("\n");
  const response = await fetch(endpoint, { method:"POST", headers:{"Content-Type":"application/x-sentry-envelope"},body });
  if (!response.ok) throw new Error(`Upload failed: ${response.status}`);
}
export function listenForErrors() {
  window.addEventListener("error", e => { if(enabled()) void sendReport(`Uncaught error: ${e.message}`).catch(()=>{}); });
  window.addEventListener("unhandledrejection", e => { if(enabled()) void sendReport(`Unhandled rejection: ${e.reason instanceof Error ? e.reason.message : "Unknown"}`).catch(()=>{}); });
}
