"use client";
import { useEffect, useState } from "react";

type ToastItem = { id: number; message: string; tone: "success" | "error" | "info" };
export function ToastViewport() {
  const [items, setItems] = useState<ToastItem[]>([]);
  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ message?: string; tone?: ToastItem["tone"] }>).detail;
      if (!detail?.message) return;
      const item = { id: Date.now() + Math.random(), message: detail.message, tone: detail.tone ?? "info" };
      setItems((current) => [...current.slice(-2), item]);
      window.setTimeout(() => setItems((current) => current.filter((row) => row.id !== item.id)), 3200);
    };
    window.addEventListener("tracehire:toast", handler); return () => window.removeEventListener("tracehire:toast", handler);
  }, []);
  return <div aria-live="polite" className="pointer-events-none fixed bottom-5 right-5 z-50 grid w-[min(360px,calc(100vw-2.5rem))] gap-2">{items.map((item) => <div key={item.id} className={`rounded-xl border p-4 text-sm shadow-lg ${item.tone === "error" ? "border-red-200 bg-red-50 text-red-800" : item.tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-zinc-200 bg-white text-zinc-700"}`}>{item.message}</div>)}</div>;
}
