"use client";
import { KeyboardEvent, useMemo, useRef } from "react";

export function CodeAnswerEditor({ value, onChange, method }: { value: string; onChange: (value: string) => void; method: string }) {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  const lines = useMemo(() => Math.max(1, value.split("\n").length), [value]);
  function keyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Tab") return;
    event.preventDefault();
    const element = event.currentTarget;
    const start = element.selectionStart;
    const end = element.selectionEnd;
    const next = `${value.slice(0, start)}  ${value.slice(end)}`;
    onChange(next);
    requestAnimationFrame(() => {
      ref.current?.focus();
      ref.current?.setSelectionRange(start + 2, start + 2);
    });
  }
  const hint = method === "SQL" ? "SQL" : method === "DEBUGGING" ? "Debugging response" : method === "CODING" ? "Code / pseudocode" : "Technical response";
  return <div className="mt-4 overflow-hidden rounded-xl border border-zinc-300 bg-zinc-950 text-zinc-100"><div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2 text-xs text-zinc-400"><span>{hint}</span><span>{lines} line{lines === 1 ? "" : "s"} · Tab inserts spaces</span></div><div className="grid grid-cols-[44px_1fr]"><div aria-hidden className="select-none border-r border-zinc-800 bg-zinc-900/70 px-2 py-3 text-right font-mono text-xs leading-6 text-zinc-600">{Array.from({ length: lines }, (_, i) => <div key={i}>{i + 1}</div>)}</div><textarea ref={ref} spellCheck={false} rows={Math.max(10, Math.min(24, lines + 3))} value={value} onKeyDown={keyDown} onChange={(event) => onChange(event.target.value)} className="w-full resize-y bg-zinc-950 p-3 font-mono text-sm leading-6 text-zinc-100 outline-none" placeholder={method === "SQL" ? "SELECT ..." : "Write your solution here…"}/></div></div>;
}
