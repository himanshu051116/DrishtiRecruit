"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Company = { name: string; website: string | null; industry: string | null; size: string | null; description: string | null; socialLinks: unknown; officeLocations: unknown };
const list = (value: unknown) => Array.isArray(value) ? value.map(String) : [];

export function CompanyProfileForm({ company }: { company: Company }) {
  const router = useRouter(); const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage(""); const form = new FormData(event.currentTarget);
    const lines = (name: string) => String(form.get(name) ?? "").split("\n").map((value) => value.trim()).filter(Boolean);
    const payload = { name: String(form.get("name") ?? ""), website: String(form.get("website") ?? ""), industry: String(form.get("industry") ?? ""), size: String(form.get("size") ?? ""), description: String(form.get("description") ?? ""), socialLinks: lines("socialLinks"), officeLocations: lines("officeLocations") };
    const response = await fetch("/api/company", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) }); const body = await response.json(); if (!response.ok) { setMessage(body.error ?? "Update failed"); return; } setMessage("Company profile updated."); router.refresh();
  }
  return <form onSubmit={submit} className="grid gap-4 md:grid-cols-2"><Field name="name" label="Company name" value={company.name}/><Field name="website" label="Website" value={company.website ?? ""}/><Field name="industry" label="Industry" value={company.industry ?? ""}/><Field name="size" label="Company size" value={company.size ?? ""}/><label className="text-sm md:col-span-2"><span className="mb-1 block font-medium">Description</span><textarea name="description" rows={4} defaultValue={company.description ?? ""} className="w-full rounded-xl border border-zinc-300 px-3 py-2.5"/></label><label className="text-sm"><span className="mb-1 block font-medium">Social links (one per line)</span><textarea name="socialLinks" rows={4} defaultValue={list(company.socialLinks).join("\n")} className="w-full rounded-xl border border-zinc-300 px-3 py-2.5"/></label><label className="text-sm"><span className="mb-1 block font-medium">Office locations (one per line)</span><textarea name="officeLocations" rows={4} defaultValue={list(company.officeLocations).join("\n")} className="w-full rounded-xl border border-zinc-300 px-3 py-2.5"/></label><div className="md:col-span-2 flex items-center gap-3"><button className="rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white">Save company profile</button>{message && <span className="text-sm text-zinc-600">{message}</span>}</div></form>;
}
function Field({ name, label, value }: { name: string; label: string; value: string }) { return <label className="text-sm"><span className="mb-1 block font-medium">{label}</span><input name={name} defaultValue={value} required={name === "name"} className="w-full rounded-xl border border-zinc-300 px-3 py-2.5"/></label>; }
