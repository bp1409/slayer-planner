import { useState } from "react";
import { Clipboard, Download, Upload } from "lucide-react";
import { type PlanInputs } from "./lib/calculator";
import { decodePlan, encodePlan, planSummary } from "./lib/sharing";

export function SharePlan({ plan, onImport }: { plan: PlanInputs; onImport: (plan: PlanInputs) => void }) {
  const [text, setText] = useState("");
  const [message, setMessage] = useState("");
  const result = planSummary(plan);
  const summary = result;

  async function copySummary() {
    if (!navigator.clipboard) { setMessage("Clipboard access is unavailable."); return; }
    try { await navigator.clipboard.writeText(summary); setMessage("Summary copied."); }
    catch { setMessage("Could not copy the summary. Check clipboard permissions."); }
  }
  function exportPlan() {
    const url = URL.createObjectURL(new Blob([encodePlan(plan)], { type: "application/json" }));
    const link = document.createElement("a"); link.href = url; link.download = "slayer-plan.json"; link.click(); URL.revokeObjectURL(url); setMessage("Plan exported.");
  }
  function importPlan() {
    try { onImport(decodePlan(text)); setMessage("Plan imported."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Could not import plan."); }
  }

  return <div className="share-plan">
    <p>Copy a Discord-ready summary or move this plan as compact versioned JSON. Imports are validated locally.</p>
    <div className="share-actions"><button type="button" className="button" onClick={() => void copySummary()}><Clipboard size={14} /> Copy summary</button><button type="button" className="button" onClick={exportPlan}><Download size={14} /> Export plan</button></div>
    <label htmlFor="plan-json">Import plan JSON</label>
    <textarea id="plan-json" value={text} onChange={(event) => setText(event.currentTarget.value)} placeholder="Paste exported plan JSON" />
    <button type="button" className="button" onClick={importPlan}><Upload size={14} /> Import plan</button>
    {message && <p className="field-note" role="status">{message}</p>}
  </div>;
}
