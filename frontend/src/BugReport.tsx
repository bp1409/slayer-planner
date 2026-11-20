import { useState } from "react";
import { createBugReport } from "./lib/bugReport";
import { enabled, sendReport, setEnabled } from "./lib/sentry";

export function BugReport() {
  const [steps, setSteps] = useState("");
  const [consent, setConsent] = useState(enabled);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const report = createBugReport(steps);

  async function submit() {
    setBusy(true);
    setStatus("");
    try { await sendReport(report); setStatus("Report uploaded to Sentry."); }
    catch (error) { setStatus(error instanceof Error ? error.message : "Upload failed. Please try again."); }
    finally { setBusy(false); }
  }

  return (
    <div className="bug-report">
      <div>
        <h2 className="bug-report__title">Help improve Slayer Planner</h2>
        <p className="bug-report__intro">Tell us what happened and we’ll send a focused report to help us investigate.</p>
      </div>
      <p className="bug-report__privacy">Only your description, app version and platform are included. Saved plans, credentials, API keys and local storage are never sent.</p>
      <label className="bug-report__label" htmlFor="bug-steps">What happened?</label>
      <textarea id="bug-steps" value={steps} onChange={(event) => setSteps(event.currentTarget.value)} rows={7} placeholder="Steps to reproduce, what you expected, and what you saw…" />
      <label className="check-row bug-report__consent">
        <input type="checkbox" checked={consent} onChange={(event) => { setConsent(event.target.checked); setEnabled(event.target.checked); }} />
        <span>Allow this report and future anonymous error reports to be sent</span>
      </label>
      <button type="button" className="button bug-report__submit" disabled={!consent || !steps.trim() || busy} onClick={() => void submit()}>
        {busy ? "Sending…" : "Send bug report"}
      </button>
      {status && <p role="status" className="field-note bug-report__status">{status}</p>}
    </div>
  );
}
