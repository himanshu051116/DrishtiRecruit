"use client";
import { useState } from "react";
export function NotificationRow({ id, title, body, read, createdAt }: { id: string; title: string; body: string; read: boolean; createdAt: string }) {
  const [isRead, setIsRead] = useState(read);
  async function markRead() { if (isRead) return; const response = await fetch(`/api/notifications/${id}/read`, { method: "POST" }); if (response.ok) setIsRead(true); }
  return <button onClick={markRead} className={`w-full rounded-2xl border p-4 text-left ${isRead ? "border-zinc-200 bg-white" : "border-zinc-300 bg-zinc-50"}`}><div className="flex items-start justify-between gap-3"><div><p className="font-medium">{title}</p><p className="mt-1 text-sm leading-6 text-zinc-600">{body}</p></div>{!isRead && <span className="mt-1 h-2.5 w-2.5 rounded-full bg-zinc-950"/>}</div><p className="mt-2 text-xs text-zinc-400">{createdAt}</p></button>;
}
