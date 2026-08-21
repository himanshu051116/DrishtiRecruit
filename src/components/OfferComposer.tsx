"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function OfferComposer({ applicationId, defaultRole, defaultLocation }: { applicationId: string; defaultRole: string; defaultLocation?: string | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    const form = new FormData(event.currentTarget);
    const benefits = String(form.get("benefits") ?? "").split("\n").map((value) => value.trim()).filter(Boolean);
    const salaryRaw = String(form.get("salary") ?? "").trim();
    const dateRaw = String(form.get("joiningDate") ?? "").trim();
    const payload = { roleTitle: String(form.get("roleTitle") ?? ""), location: String(form.get("location") ?? ""), salary: salaryRaw ? Number(salaryRaw) : undefined, joiningDate: dateRaw ? new Date(`${dateRaw}T00:00:00Z`).toISOString() : undefined, benefits };
    try {
      const response = await fetch(`/api/applications/${applicationId}/offers`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const body = await response.json(); if (!response.ok) throw new Error(body.error ?? "Offer creation failed");
      setMessage("Offer sent to candidate."); router.refresh();
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : "Offer creation failed"); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="grid gap-3 md:grid-cols-2">
    <label className="text-sm"><span className="mb-1 block font-medium">Role</span><input name="roleTitle" defaultValue={defaultRole} required className="w-full rounded-xl border border-zinc-300 px-3 py-2.5"/></label>
    <label className="text-sm"><span className="mb-1 block font-medium">Salary (INR)</span><input name="salary" type="number" min="0" className="w-full rounded-xl border border-zinc-300 px-3 py-2.5"/></label>
    <label className="text-sm"><span className="mb-1 block font-medium">Joining date</span><input name="joiningDate" type="date" className="w-full rounded-xl border border-zinc-300 px-3 py-2.5"/></label>
    <label className="text-sm"><span className="mb-1 block font-medium">Location</span><input name="location" defaultValue={defaultLocation ?? ""} className="w-full rounded-xl border border-zinc-300 px-3 py-2.5"/></label>
    <label className="text-sm md:col-span-2"><span className="mb-1 block font-medium">Benefits (one per line)</span><textarea name="benefits" rows={3} className="w-full rounded-xl border border-zinc-300 px-3 py-2.5" placeholder="Health insurance\nLearning budget\nHybrid work"/></label>
    <div className="md:col-span-2 flex items-center gap-3"><button disabled={busy} className="rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50">{busy ? "Sending…" : "Generate & send offer"}</button>{message && <span className="text-sm text-zinc-600">{message}</span>}</div>
  </form>;
}
