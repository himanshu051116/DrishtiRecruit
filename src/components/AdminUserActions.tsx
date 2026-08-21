"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

const roles = ["CANDIDATE", "RECRUITER", "HIRING_MANAGER", "INTERVIEWER", "ADMIN"] as const;

export function AdminUserActions({ userId, role, isActive }: { userId: string; role: string; isActive: boolean }) {
  const router = useRouter();
  const [nextRole, setNextRole] = useState(role);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function patch(payload: Record<string, unknown>) {
    setBusy(true); setMessage("");
    const response = await fetch(`/api/admin/users/${userId}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    const body = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) { setMessage(body.error ?? "Update failed"); return; }
    setMessage("Updated"); router.refresh();
  }

  return <div className="mt-2 flex flex-wrap items-center gap-2">
    <select value={nextRole} onChange={(e) => setNextRole(e.target.value)} className="rounded-lg border border-zinc-300 bg-white px-2 py-1 text-xs">
      {roles.map((item) => <option key={item} value={item}>{item}</option>)}
    </select>
    <button disabled={busy || nextRole === role} onClick={() => patch({ role: nextRole })} className="rounded-lg border border-zinc-300 px-2.5 py-1 text-xs font-medium disabled:opacity-40">Save role</button>
    <button disabled={busy} onClick={() => patch({ isActive: !isActive })} className={`rounded-lg px-2.5 py-1 text-xs font-medium ${isActive ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>{isActive ? "Deactivate" : "Reactivate"}</button>
    {message && <span className="text-xs text-zinc-500">{message}</span>}
  </div>;
}
