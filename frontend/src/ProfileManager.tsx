import { useState } from "react";
import type { GrindingProfile } from "./lib/profiles";

export function ProfileManager({ profiles, activeId, onSelect, onChange }: { profiles: GrindingProfile[]; activeId: string; onSelect: (id: string) => void; onChange: (profiles: GrindingProfile[]) => void }) {
  const [name, setName] = useState("");
  return <section aria-labelledby="profiles-title"><h3 id="profiles-title">Grinding profiles</h3>
    <label className="preference-row">Active profile<select value={activeId} onChange={(event) => onSelect(event.currentTarget.value)}>{profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}</select></label>
    <div className="number-control"><input aria-label="New profile name" value={name} onChange={(event) => setName(event.currentTarget.value)} placeholder="New profile name" /><button type="button" className="button" onClick={() => { const profile: GrindingProfile = { id: `${Date.now()}`, name: name.trim() || "Profile", completionTimes: {} }; onChange([...profiles, profile]); onSelect(profile.id); setName(""); }}>Add</button></div>
    {profiles.length > 1 && <button type="button" className="text-button" onClick={() => { const next = profiles.filter((profile) => profile.id !== activeId); onChange(next); onSelect(next[0].id); }}>Delete active profile</button>}
  </section>;
}
