"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { humanizeEnum } from "@/lib/ui/labels";

type Requirement = { id: string; name: string; category: string; recruiterApproved: boolean };
type Job = { id: string; title: string; requirements: Requirement[] };
type Question = { id: string; requirementId: string | null; requirementName: string | null; category: string; method: string; difficulty: string; prompt: string; maxScore: number };
type Assessment = { id: string; jobId: string | null; title: string; description: string | null; durationMin: number; active: boolean; source: string; version: number; versionGroupId: string; questions: Question[]; job: { id: string; title: string } | null; _count: { attempts: number } };

export function AssessmentStudio({ jobs, assessments }: { jobs: Job[]; assessments: Assessment[] }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(assessments[0]?.id ?? "");
  const selected = assessments.find((item) => item.id === selectedId);
  const selectedJob = jobs.find((job) => job.id === selected?.jobId);
  const locked = Boolean(selected && selected._count.attempts > 0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const [jobId, setJobId] = useState(jobs[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [durationMin, setDurationMin] = useState(20);

  const [requirementId, setRequirementId] = useState("");
  const [category, setCategory] = useState("TECHNICAL_SKILL");
  const [method, setMethod] = useState("MCQ");
  const [difficulty, setDifficulty] = useState("MEDIUM");
  const [prompt, setPrompt] = useState("");
  const [maxScore, setMaxScore] = useState(10);
  const [rubricType, setRubricType] = useState<"single_choice" | "keyword">("single_choice");
  const [choices, setChoices] = useState(["", "", "", ""]);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [keywordsText, setKeywordsText] = useState("");
  const [minimumHits, setMinimumHits] = useState(2);

  const requirements = useMemo(() => selectedJob?.requirements.filter((r) => r.recruiterApproved) ?? [], [selectedJob]);

  async function createAssessment() {
    setBusy(true); setMessage("");
    const response = await fetch("/api/assessments", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jobId, title, description: description || undefined, durationMin }) });
    const body = await response.json().catch(() => ({})); setBusy(false);
    if (!response.ok) return setMessage(body.error ?? "Could not create assessment");
    setTitle(""); setDescription(""); setMessage("Assessment created."); router.refresh();
  }

  function onRequirementChange(value: string) {
    setRequirementId(value);
    const requirement = requirements.find((item) => item.id === value);
    if (requirement) setCategory(requirement.category);
  }

  async function addQuestion() {
    if (!selected) return;
    setBusy(true); setMessage("");
    const cleanChoices = choices.map((item) => item.trim()).filter(Boolean);
    const keywords = keywordsText.split(",").map((item) => item.trim()).filter(Boolean);
    const rubric = rubricType === "single_choice" ? { type: "single_choice", choices: cleanChoices, correctIndex } : { type: "keyword", keywords, minimumHits };
    const response = await fetch(`/api/assessments/${selected.id}/questions`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ requirementId: requirementId || undefined, category, method, difficulty, prompt, maxScore, rubric }) });
    const body = await response.json().catch(() => ({})); setBusy(false);
    if (!response.ok) return setMessage(body.error ?? "Could not add question");
    setPrompt(""); setChoices(["", "", "", ""]); setKeywordsText(""); setCorrectIndex(0); setMessage("Question added."); router.refresh();
  }

  async function toggleActive() {
    if (!selected) return;
    setBusy(true); setMessage("");
    const response = await fetch(`/api/assessments/${selected.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ active: !selected.active }) });
    setBusy(false);
    if (!response.ok) { const body = await response.json().catch(() => ({})); return setMessage(body.error ?? "Could not update assessment"); }
    router.refresh();
  }

  async function createNewVersion() {
    if (!selected) return;
    setBusy(true); setMessage("");
    const response = await fetch(`/api/assessments/${selected.id}/clone`, { method: "POST" });
    const body = await response.json().catch(() => ({})); setBusy(false);
    if (!response.ok) return setMessage(body.error ?? "Could not create assessment version");
    setSelectedId(body.assessment.id); setMessage(`Version ${body.assessment.version} created as an inactive draft.`); router.refresh();
  }

  async function deleteQuestion(questionId: string) {
    if (!confirm("Delete this question? Questions with candidate answers are protected.")) return;
    const response = await fetch(`/api/assessment-questions/${questionId}`, { method: "DELETE" });
    if (!response.ok) { const body = await response.json().catch(() => ({})); return setMessage(body.error ?? "Could not delete question"); }
    router.refresh();
  }

  return <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
    <aside className="space-y-5">
      <section className="surface-card p-5"><p className="section-kicker">New assessment</p><h2 className="section-heading mt-1">Create a reusable verification</h2><div className="mt-4 grid gap-3"><Field label="Job"><select value={jobId} onChange={(event) => setJobId(event.target.value)} className="w-full rounded-xl border border-zinc-300 bg-white p-3 text-sm">{jobs.map((job) => <option key={job.id} value={job.id}>{job.title}</option>)}</select></Field><Field label="Assessment name"><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Backend evidence check" className="w-full rounded-xl border border-zinc-300 p-3 text-sm"/></Field><Field label="Candidate instructions"><textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Explain the purpose and what candidates should expect." className="min-h-24 w-full rounded-xl border border-zinc-300 p-3 text-sm"/></Field><Field label="Duration"><div className="relative"><input type="number" min={1} max={240} value={durationMin} onChange={(event) => setDurationMin(Number(event.target.value))} className="w-full rounded-xl border border-zinc-300 p-3 pr-16 text-sm"/><span className="absolute right-3 top-3 text-xs text-zinc-400">minutes</span></div></Field><button disabled={busy || !jobId || title.trim().length < 2} onClick={createAssessment} className="btn-primary w-full disabled:opacity-40">Create assessment</button></div></section>
      <section className="surface-card p-4"><div className="flex items-center justify-between"><div><p className="section-kicker">Library</p><h2 className="section-heading mt-1">Assessments</h2></div><span className="text-xs text-zinc-400">{assessments.length}</span></div><div className="mt-3 space-y-2">{assessments.length === 0 ? <p className="text-sm text-zinc-500">No assessments yet.</p> : assessments.map((item) => <button key={item.id} onClick={() => { setSelectedId(item.id); setRequirementId(""); }} className={`w-full rounded-xl border p-3 text-left text-sm ${item.id === selectedId ? "border-indigo-300 bg-indigo-50" : "border-zinc-200 bg-white hover:bg-zinc-50"}`}><div className="flex items-start justify-between gap-3"><span className="font-semibold">{item.title}</span><span className={`status-pill ${item.active ? "status-success" : "status-neutral"}`}>{item.active ? "Active" : "Draft"}</span></div><p className="mt-1 text-[10px] leading-5 text-zinc-500">{item.job?.title ?? "No job"} · v{item.version} · {item.questions.length} questions · {item._count.attempts} attempts</p></button>)}</div></section>
    </aside>

    <section className="surface-card min-w-0 p-5 sm:p-6">
      {!selected ? <p className="text-sm text-zinc-500">Create or select an assessment to build the test.</p> : <>
        <div className="page-header"><div><p className="page-eyebrow">{selected.job?.title}</p><h2 className="page-title !text-2xl">{selected.title}</h2><p className="page-description">{selected.durationMin} minutes · version {selected.version} · {selected.questions.length} questions · {selected._count.attempts} attempts</p></div><button onClick={toggleActive} disabled={busy} className="btn-secondary">{selected.active ? "Deactivate" : "Activate"}</button></div>
        {locked && <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"><span><strong>Version {selected.version} is locked for comparability.</strong> Existing candidate attempts remain tied to this exact version.</span><button type="button" onClick={createNewVersion} disabled={busy} className="btn-secondary bg-white disabled:opacity-50">Create version {selected.version + 1}</button></div>}

        <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="section-kicker">Question builder</p><h3 className="section-heading mt-1">Add a criterion-linked question</h3><p className="section-description">Recruiter-friendly controls below are stored as the same deterministic rubric used by the assessment engine.</p></div><span className={`status-pill ${locked ? "status-warning" : "status-success"}`}>{locked ? "Locked" : "Editable"}</span></div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Field label="Linked criterion"><select value={requirementId} onChange={(event) => onRequirementChange(event.target.value)} className="w-full rounded-xl border border-zinc-300 bg-white p-3 text-sm"><option value="">General question</option>{requirements.map((requirement) => <option key={requirement.id} value={requirement.id}>{requirement.name}</option>)}</select></Field>
            <Field label="Question type"><select value={method} onChange={(event) => { setMethod(event.target.value); if (event.target.value !== "MCQ") setRubricType("keyword"); }} className="w-full rounded-xl border border-zinc-300 bg-white p-3 text-sm">{["MCQ","CODING","SQL","DEBUGGING","PRACTICAL"].map((value) => <option key={value} value={value}>{humanizeEnum(value)}</option>)}</select></Field>
            <Field label="Competency category"><select value={category} onChange={(event) => setCategory(event.target.value)} className="w-full rounded-xl border border-zinc-300 bg-white p-3 text-sm">{["TECHNICAL_SKILL","EXPERIENCE","EDUCATION","COMPETENCY","COMMUNICATION","LEADERSHIP","OTHER"].map((value) => <option key={value} value={value}>{humanizeEnum(value)}</option>)}</select></Field>
            <Field label="Difficulty"><select value={difficulty} onChange={(event) => setDifficulty(event.target.value)} className="w-full rounded-xl border border-zinc-300 bg-white p-3 text-sm">{["EASY","MEDIUM","ADVANCED"].map((value) => <option key={value} value={value}>{humanizeEnum(value)}</option>)}</select></Field>
            <div className="md:col-span-2"><Field label="Question / task"><textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} className="min-h-28 w-full rounded-xl border border-zinc-300 bg-white p-3 text-sm" placeholder="Write the question exactly as the candidate should see it."/></Field></div>
            <Field label="Maximum score"><input type="number" min={1} max={100} value={maxScore} onChange={(event) => setMaxScore(Number(event.target.value))} className="w-full rounded-xl border border-zinc-300 bg-white p-3 text-sm"/></Field>
            <Field label="Evaluation format"><select value={rubricType} onChange={(event) => setRubricType(event.target.value as "single_choice" | "keyword")} className="w-full rounded-xl border border-zinc-300 bg-white p-3 text-sm"><option value="single_choice">One correct option</option><option value="keyword">Expected concepts</option></select></Field>
          </div>

          {rubricType === "single_choice" ? <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-4"><p className="text-xs font-semibold">Answer options</p><p className="mt-1 text-[11px] text-zinc-500">Select the radio button beside the correct answer. Candidates never see this marker.</p><div className="mt-3 space-y-2">{choices.map((choice, index) => <label key={index} className="flex items-center gap-3"><input type="radio" name="correct-choice" checked={correctIndex === index} onChange={() => setCorrectIndex(index)} aria-label={`Mark option ${index + 1} as correct`}/><input value={choice} onChange={(event) => setChoices((current) => current.map((item, idx) => idx === index ? event.target.value : item))} placeholder={`Option ${index + 1}`} className="min-w-0 flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm"/></label>)}</div></div> : <div className="mt-4 grid gap-4 rounded-xl border border-zinc-200 bg-white p-4 md:grid-cols-[1fr_180px]"><Field label="Expected concepts"><input value={keywordsText} onChange={(event) => setKeywordsText(event.target.value)} className="w-full rounded-xl border border-zinc-300 bg-white p-3 text-sm" placeholder="transaction safety, idempotency, validation"/><span className="mt-1.5 block text-[10px] leading-4 text-zinc-400">Separate concepts with commas. They are used as deterministic scoring signals.</span></Field><Field label="Concepts required"><div className="relative"><input type="number" min={1} value={minimumHits} onChange={(event) => setMinimumHits(Number(event.target.value))} className="w-full rounded-xl border border-zinc-300 bg-white p-3 pr-14 text-sm"/><span className="absolute right-3 top-3 text-xs text-zinc-400">minimum</span></div></Field></div>}
          <button onClick={addQuestion} disabled={busy || locked || prompt.trim().length < 10} className="btn-primary mt-4 disabled:opacity-40">Add question</button>
        </div>

        <div className="mt-6"><div className="flex items-center justify-between"><div><p className="section-kicker">Assessment content</p><h3 className="section-heading mt-1">Questions</h3></div><span className="text-xs text-zinc-400">{selected.questions.length} total</span></div><div className="mt-3 space-y-3">{selected.questions.length === 0 ? <p className="rounded-xl border border-dashed border-zinc-300 p-5 text-sm text-zinc-500">No questions yet. Add at least one before assigning this assessment.</p> : selected.questions.map((question, index) => <article key={question.id} className="rounded-xl border border-zinc-200 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="rounded-md bg-zinc-100 px-2 py-1 text-[10px] font-bold">Q{index + 1}</span><span className="status-pill status-neutral">{humanizeEnum(question.method)}</span><span className="text-[10px] text-zinc-400">{humanizeEnum(question.difficulty)} · {question.maxScore} marks</span></div><p className="mt-3 text-sm font-medium leading-6">{question.prompt}</p><p className="mt-2 text-[11px] text-zinc-500">Criterion: <strong>{question.requirementName ?? "General"}</strong> · {humanizeEnum(question.category)}</p></div><button onClick={() => deleteQuestion(question.id)} disabled={locked} className="text-xs font-semibold text-red-600 disabled:cursor-not-allowed disabled:text-zinc-300">Delete</button></div></article>)}</div></div>
      </>}
      {message && <p role="status" className="mt-4 rounded-xl bg-zinc-50 px-4 py-3 text-sm text-zinc-600">{message}</p>}
    </section>
  </div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-[11px] font-semibold text-zinc-500"><span className="mb-1.5 block">{label}</span>{children}</label>; }
