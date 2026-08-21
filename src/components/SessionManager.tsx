"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type SessionRow = { id: string; userAgent: string | null; createdAt: string; lastSeenAt: string; expiresAt: string; current: boolean };

function describeAgent(agent: string | null) {
  if (!agent) return "Unknown device";
  const browser = agent.includes("Chrome/") ? "Chrome" : agent.includes("Firefox/") ? "Firefox" : agent.includes("Safari/") ? "Safari" : agent.includes("Edge/") || agent.includes("Edg/") ? "Edge" : "Browser";
  const os = agent.includes("Windows") ? "Windows" : agent.includes("Mac OS") ? "macOS" : agent.includes("Android") ? "Android" : agent.includes("iPhone") || agent.includes("iPad") ? "iOS/iPadOS" : agent.includes("Linux") ? "Linux" : "Unknown OS";
  return `${browser} · ${os}`;
}

export function SessionManager() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function load() {
    const response = await fetch("/api/auth/sessions", { cache: "no-store" });
    const body = await response.json();
    if (response.ok) setSessions(body.data ?? []);
  }
  useEffect(() => { void load(); }, []);

  async function revoke(id: string) {
    setBusy(id); setMessage("");
    try {
      const response = await fetch(`/api/auth/sessions/${id}`, { method: "DELETE" });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error ?? "Could not revoke session");
      setSessions((current) => current.filter((session) => session.id !== id));
      setMessage("Device session revoked.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not revoke session"); }
    finally { setBusy(null); }
  }

  async function logoutAll() {
    setBusy("all"); setMessage("");
    try {
      const response = await fetch("/api/auth/logout-all", { method: "POST" });
      if (!response.ok) throw new Error("Could not revoke all sessions");
      router.replace("/login"); router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not revoke all sessions"); setBusy(null); }
  }

  return <div className="space-y-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-medium">Active device sessions</p><p className="mt-1 text-sm text-zinc-500">Review active sessions and revoke devices you no longer use.</p></div><button onClick={logoutAll} disabled={busy !== null} className="rounded-xl border border-zinc-300 px-3 py-2 text-xs font-medium disabled:opacity-50">{busy === "all" ? "Revoking…" : "Logout all devices"}</button></div><div className="space-y-2">{sessions.length === 0 ? <p className="text-sm text-zinc-500">No active sessions found.</p> : sessions.map((session) => <div key={session.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-zinc-50 p-4"><div><div className="flex items-center gap-2"><p className="text-sm font-medium">{describeAgent(session.userAgent)}</p>{session.current && <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700">Current session</span>}</div><p className="mt-1 text-xs text-zinc-500">Created {new Date(session.createdAt).toLocaleString()} · last active {new Date(session.lastSeenAt).toLocaleString()}</p></div>{!session.current && <button onClick={() => revoke(session.id)} disabled={busy !== null} className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium disabled:opacity-50">{busy === session.id ? "Revoking…" : "Revoke"}</button>}</div>)}</div>{message && <p className="text-sm text-zinc-600">{message}</p>}</div>;
}
