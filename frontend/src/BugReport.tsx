import { useState } from "react";
import { createBugReport } from "./lib/bugReport";

export function BugReport() { const [steps, setSteps] = useState(""); const [message, setMessage] = useState("");
  const report = createBugReport(steps);
  return <div><p className="field-note">This report excludes credentials, API keys, personal data and local storage contents.</p><label htmlFor="bug-steps">Reproduction steps</label><textarea id="bug-steps" value={steps} onChange={(event) => setSteps(event.currentTarget.value)} rows={6} /><button type="button" className="button" onClick={() => void navigator.clipboard?.writeText(report).then(() => setMessage("Bug report copied."))}>Copy bug report</button>{message && <p role="status" className="field-note">{message}</p>}<pre className="field-note">{report}</pre></div>;
}
