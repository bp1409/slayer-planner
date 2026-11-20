import { useState } from "react";
import { createBugReport } from "./lib/bugReport";
import { enabled, setEnabled, sendReport } from "./lib/sentry";
export function BugReport() {
  const [steps,setSteps] = useState("");
  const [consent,setConsent] = useState(enabled);
  const [status,setStatus] = useState("");
  const [busy,setBusy] = useState(false);
  const report = createBugReport(steps);
  async function submit() {
    setBusy(true); setStatus("");
    try { await sendReport(report); setStatus("Report uploaded to Sentry."); }
    catch(e) { setStatus(e instanceof Error ? e.message : "Upload failed"); }
    finally { setBusy(false); }
  }
  return <div>
    <p className="field-note">Reports include the displayed text, app version and platform, but not saved plans or credentials. Internet is required.</p>
    <label htmlFor="bug-steps">Reproduction steps</label>
    <textarea id="bug-steps" value={steps} onChange={e=>setSteps(e.currentTarget.value)} rows={6}/>
    <label><input type="checkbox" checked={consent} onChange={e=>{setConsent(e.target.checked);setEnabled(e.target.checked);}}/> Allow Sentry uploads and future uncaught error reporting</label>
    <button type="button" className="button" disabled={!consent || !steps.trim() || busy} onClick={()=>void submit()}>{busy?"Sending…":"Send bug report"}</button>{" "}
    <button type="button" className="button" onClick={()=>void navigator.clipboard.writeText(report).then(()=>setStatus("Copied")).catch(()=>setStatus("Clipboard unavailable"))}>Copy bug report</button>
    {status && <p role="status" className="field-note">{status}</p>}
    <pre className="field-note">{report}</pre>
  </div>;
}
