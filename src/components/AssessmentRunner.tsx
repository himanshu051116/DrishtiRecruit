"use client";
import { CodeAnswerEditor } from "@/components/CodeAnswerEditor";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

type Question = { id: string; prompt: string; type: "single_choice" | "text"; choices?: string[]; maxScore: number; method?: string; difficulty?: string };

export function AssessmentRunner({ attemptId, startedAt, durationMin, questions, initialAnswers = {} }: { attemptId: string; startedAt: string | null; durationMin: number; questions: Question[]; initialAnswers?: Record<string, string> }) {
  const router = useRouter();
  const submitting = useRef(false);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstRender = useRef(true);
  const [started, setStarted] = useState(Boolean(startedAt));
  const [startTime, setStartTime] = useState(startedAt ? new Date(startedAt).getTime() : 0);
  const [now, setNow] = useState(Date.now());
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const endTime = useMemo(() => startTime ? startTime + durationMin * 60_000 : 0, [startTime, durationMin]);
  const secondsLeft = endTime ? Math.max(0, Math.ceil((endTime - now) / 1000)) : durationMin * 60;

  useEffect(() => {
    if (!started) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const onVisibility = () => { if (document.hidden) void fetch(`/api/assessment-attempts/${attemptId}/tab-switch`, { method: "POST" }); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [started, attemptId]);

  useEffect(() => {
    if (!started) return;
    if (firstRender.current) { firstRender.current = false; return; }
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    setSaveState("saving");
    autosaveTimer.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/assessment-attempts/${attemptId}/answers`, {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ answers: questions.map((question) => ({ questionId: question.id, answer: answers[question.id] ?? "" })) }),
        });
        setSaveState(response.ok ? "saved" : "error");
      } catch { setSaveState("error"); }
    }, 700);
    return () => { if (autosaveTimer.current) clearTimeout(autosaveTimer.current); };
  }, [answers, attemptId, questions, started]);

  useEffect(() => {
    if (started && secondsLeft === 0 && !busy && !submitting.current) void submit(true);
  }, [started, secondsLeft]);

  async function start() {
    setBusy(true);
    const response = await fetch(`/api/assessment-attempts/${attemptId}/start`, { method: "POST" });
    const body = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) { setMessage(body.error ?? "Could not start assessment"); return; }
    const time = new Date(body.data.startedAt).getTime();
    setStartTime(time); setStarted(true); setNow(Date.now());
  }

  async function submit(auto = false) {
    if (submitting.current) return;
    submitting.current = true; setBusy(true);
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    setMessage(auto ? "Time expired. Submitting your saved answers…" : "");
    const response = await fetch(`/api/assessment-attempts/${attemptId}/submit`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ answers: questions.map((q) => ({ questionId: q.id, answer: answers[q.id] ?? "" })) }),
    });
    const body = await response.json().catch(() => ({})); setBusy(false);
    if (!response.ok) { submitting.current = false; setMessage(body.error ?? "Assessment submission failed"); return; }
    setMessage(`${body.data.timedOut ? "Time expired. Saved answers submitted." : "Submitted."} Score: ${Math.round(body.data.percent)}%. Evidence coverage has been recalculated.`); router.refresh();
  }

  if (!started) return <div className="rounded-2xl border border-zinc-200 bg-white p-6"><p className="text-sm text-zinc-600">Once started, the {durationMin}-minute timer begins. Draft answers are autosaved after you start. Tab visibility changes are recorded as a monitoring signal but are not automatically treated as misconduct.</p><button onClick={start} disabled={busy} className="mt-4 rounded-xl bg-zinc-950 px-4 py-2 text-sm font-medium text-white">{busy ? "Starting…" : "Start assessment"}</button>{message && <p className="mt-3 text-sm text-zinc-500">{message}</p>}</div>;

  return <div className="space-y-5"><div className="sticky top-3 z-10 flex items-center justify-between rounded-2xl border border-zinc-200 bg-white/95 p-4 shadow-sm backdrop-blur"><div><span className="text-sm font-medium">Assessment in progress</span><p className="text-xs text-zinc-400">Answers submit automatically when time expires. {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Draft saved." : saveState === "error" ? "Autosave failed — keep this page open." : ""}</p></div><span className={`font-mono text-sm ${secondsLeft < 60 ? "font-semibold text-red-600" : ""}`}>{Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, "0")}</span></div>{questions.map((q, index) => { const codeLike = ["CODING","SQL","DEBUGGING"].includes(q.method ?? ""); return <section key={q.id} className="rounded-2xl border border-zinc-200 bg-white p-6"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Question {index + 1} · {q.maxScore} marks</p><div className="flex gap-2">{q.method && <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs">{q.method}</span>}{q.difficulty && <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs">{q.difficulty}</span>}</div></div><h2 className="mt-3 font-medium leading-7">{q.prompt}</h2>{q.type === "single_choice" ? <div className="mt-4 space-y-2">{q.choices?.map((choice, optionIndex) => <label key={choice} className="flex cursor-pointer gap-3 rounded-xl border border-zinc-200 p-3 text-sm hover:bg-zinc-50"><input type="radio" name={q.id} value={optionIndex} checked={answers[q.id] === String(optionIndex)} onChange={(e) => setAnswers((current) => ({ ...current, [q.id]: e.target.value }))}/><span>{choice}</span></label>)}</div> : codeLike ? <CodeAnswerEditor method={q.method ?? "CODING"} value={answers[q.id] ?? ""} onChange={(value) => setAnswers((current) => ({ ...current, [q.id]: value }))}/> : <textarea spellCheck rows={7} value={answers[q.id] ?? ""} onChange={(e) => setAnswers((current) => ({ ...current, [q.id]: e.target.value }))} className="mt-4 w-full rounded-xl border border-zinc-300 p-3 text-sm" placeholder="Write your answer…"/>}</section>})}<button onClick={() => submit(false)} disabled={busy} className="rounded-xl bg-zinc-950 px-5 py-3 text-sm font-medium text-white disabled:opacity-50">{busy ? "Submitting…" : "Submit assessment"}</button>{message && <p className="text-sm text-zinc-600">{message}</p>}</div>;
}
