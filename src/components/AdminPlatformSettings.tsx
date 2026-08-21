"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminPlatformSettings({ initial }: { initial: { candidateSelfSchedulingEnabled: boolean; maintenanceNotice: string; dataRetentionDays: number } }) {
  const router = useRouter();
  const [selfScheduling, setSelfScheduling] = useState(initial.candidateSelfSchedulingEnabled);
  const [notice, setNotice] = useState(initial.maintenanceNotice);
  const [retention, setRetention] = useState(initial.dataRetentionDays);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function save() {
    setBusy(true); setMessage("");
    const response = await fetch("/api/admin/settings", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ candidateSelfSchedulingEnabled: selfScheduling, maintenanceNotice: notice, dataRetentionDays: retention }) });
    const body = await response.json().catch(() => ({})); setBusy(false);
    if (!response.ok) return setMessage(body.error ?? "Could not save settings");
    setMessage("Platform settings saved."); router.refresh();
  }
  return <div className="grid gap-4 md:grid-cols-2"><label className="flex items-start gap-3 rounded-xl bg-zinc-50 p-4 text-sm"><input type="checkbox" checked={selfScheduling} onChange={(e) => setSelfScheduling(e.target.checked)} className="mt-1"/><span><strong>Candidate self-scheduling</strong><span className="mt-1 block text-xs text-zinc-500">Allow candidates to select published interviewer slots.</span></span></label><label className="text-xs text-zinc-500">Operational retention window (days)<input type="number" min={30} max={3650} value={retention} onChange={(e) => setRetention(Number(e.target.value))} className="mt-1 w-full rounded-xl border border-zinc-300 p-3 text-sm"/></label><label className="md:col-span-2 text-xs text-zinc-500">Maintenance / platform notice<textarea value={notice} onChange={(e) => setNotice(e.target.value)} className="mt-1 min-h-20 w-full rounded-xl border border-zinc-300 p-3 text-sm" maxLength={500}/></label><div className="md:col-span-2"><button onClick={save} disabled={busy} className="rounded-xl bg-zinc-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-40">{busy ? "Saving…" : "Save platform settings"}</button>{message && <span className="ml-3 text-xs text-zinc-500">{message}</span>}</div></div>;
}
