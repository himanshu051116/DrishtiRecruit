import { prisma } from "@/lib/prisma";
import { sha256Json } from "@/lib/integrity/canonicalJson";

function clean(value: string | null | undefined, fallback = "—") {
  const text = value?.replace(/\s+/g, " ").trim();
  return text || fallback;
}

function percent(value: number | null | undefined) {
  return `${Math.round(value ?? 0)}%`;
}

export async function getDecisionPacketData(applicationId: string) {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      candidate: { include: { user: true } },
      job: {
        include: {
          company: true,
          requirements: {
            where: { recruiterApproved: true },
            orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
          },
        },
      },
      evidence: { orderBy: { createdAt: "asc" } },
      evaluations: true,
      attempts: {
        include: { assessment: true },
        orderBy: { createdAt: "desc" },
      },
      interviews: {
        include: { interviewer: true, scorecards: true },
        orderBy: { scheduledAt: "desc" },
      },
      decisions: {
        include: { decisionOwner: true },
        orderBy: { createdAt: "desc" },
      },
      stageEvents: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!application) throw new Response("Application not found", { status: 404 });
  const aiRuns = await prisma.aiRun.findMany({ where: { applicationId }, orderBy: { createdAt: "desc" }, take: 20 });
  return { ...application, aiRuns };
}

export function buildDecisionPacketLines(application: Awaited<ReturnType<typeof getDecisionPacketData>>) {
  const evaluationByRequirement = new Map(application.evaluations.map((item) => [item.requirementId, item]));
  const latestDecision = application.decisions[0] ?? null;
  const unresolved = application.job.requirements.filter((requirement) => {
    const status = evaluationByRequirement.get(requirement.id)?.status ?? "MISSING";
    return requirement.priority === "MUST_HAVE" && ["MISSING", "WEAK", "PARTIAL"].includes(status);
  });
  const conflicting = application.job.requirements.filter((requirement) =>
    requirement.priority === "MUST_HAVE" && evaluationByRequirement.get(requirement.id)?.status === "CONFLICTING",
  );

  const lines: string[] = [
    "TRACEHIRE DECISION EVIDENCE PACKET",
    "",
    `Generated: ${new Date().toISOString()}`,
    `Company: ${clean(application.job.company.name)}`,
    `Role: ${clean(application.job.title)}`,
    `Candidate: ${clean(application.candidate.user.name)}`,
    `Application ID: ${application.id}`,
    `Current stage: ${application.stage.replaceAll("_", " ")}`,
    "",
    "DECISION SUMMARY",
    `Fit score: ${percent(application.fitScore)}`,
    `Evidence coverage: ${percent(application.evidenceCoverage)}`,
    `Decision coverage: ${percent(application.decisionCoverage)}`,
    `Unresolved must-haves: ${unresolved.length ? unresolved.map((item) => item.name).join(", ") : "None"}`,
    `Conflicting must-haves: ${conflicting.length ? conflicting.map((item) => item.name).join(", ") : "None"}`,
    `Latest human decision: ${latestDecision ? latestDecision.humanDecision : "Not recorded"}`,
    latestDecision ? `Decision owner: ${latestDecision.decisionOwner.name}` : "Decision owner: —",
    latestDecision ? `Decision coverage at decision: ${percent(latestDecision.decisionCoverage)}` : "Decision coverage at decision: —",
    latestDecision?.override ? `Override recorded: Yes — ${clean(latestDecision.overrideReason, "reason not supplied")}` : "Override recorded: No",
    latestDecision?.evidenceSnapshotSha256 ? `Decision snapshot SHA-256: ${latestDecision.evidenceSnapshotSha256}` : "Decision snapshot SHA-256: Not available (legacy/no decision)",
    latestDecision?.evidenceSnapshotSha256 ? `Snapshot integrity check: ${sha256Json(latestDecision.evidenceSnapshot) === latestDecision.evidenceSnapshotSha256 ? "PASS" : "FAIL"}` : "Snapshot integrity check: Not available",
    "",
    "IMPORTANT INTERPRETATION NOTE",
    "DrishtiRecruit separates apparent fit from evidence sufficiency. Missing evidence is not proof of missing ability, and conflicting evidence is a review signal rather than an accusation.",
    "",
    "REQUIREMENT EVIDENCE",
  ];

  for (const requirement of application.job.requirements) {
    const evaluation = evaluationByRequirement.get(requirement.id);
    const evidence = application.evidence.filter((item) => item.requirementId === requirement.id);
    lines.push(
      "",
      `${requirement.name} [${requirement.priority}]`,
      `Status: ${evaluation?.status ?? "MISSING"} | Fit ${percent(evaluation?.fitScore)} | Coverage ${percent(evaluation?.evidenceCoverage)}`,
      `Evidence items: ${evidence.length} | Independent sources: ${evaluation?.independentSourceCount ?? 0}`,
    );
    if (!evidence.length) {
      lines.push("- No evidence currently recorded.");
      continue;
    }
    for (const item of evidence.slice(0, 4)) {
      const polarity = item.contradictsRequirement ? "CONTRADICTS" : item.supportsRequirement ? "SUPPORTS" : "CONTEXT";
      lines.push(`- ${item.sourceType} | ${item.strength} | ${Math.round(item.confidence * 100)}% confidence | ${polarity}${item.verified ? " | VERIFIED" : ""}`);
      if (item.sourceExcerpt) lines.push(`  Evidence: ${clean(item.sourceExcerpt)}`);
    }
    if (evidence.length > 4) lines.push(`- ${evidence.length - 4} additional evidence item(s) available in DrishtiRecruit.`);
  }

  lines.push("", "ASSESSMENT HISTORY");
  if (!application.attempts.length) lines.push("No assessment attempts recorded.");
  for (const attempt of application.attempts) {
    lines.push(`${attempt.assessment.title} | ${attempt.status} | Score ${attempt.score ?? "—"}/${attempt.maxScore ?? "—"} | Tab switches ${attempt.tabSwitchCount}`);
  }

  lines.push("", "INTERVIEW HISTORY");
  if (!application.interviews.length) lines.push("No interviews recorded.");
  for (const interview of application.interviews) {
    lines.push(`${interview.type} | ${interview.interviewer.name} | ${interview.status} | ${interview.scheduledAt.toISOString()}`);
    for (const scorecard of interview.scorecards) {
      lines.push(`- ${scorecard.criterion}: ${scorecard.score}/5${scorecard.evidenceNote ? ` | ${clean(scorecard.evidenceNote)}` : ""}`);
    }
  }

  lines.push("", "WORKFLOW HISTORY");
  if (!application.stageEvents.length) lines.push("No stage history recorded.");
  for (const event of application.stageEvents) {
    lines.push(`${event.createdAt.toISOString()} | ${event.fromStage ?? "START"} -> ${event.toStage}${event.reason ? ` | ${clean(event.reason)}` : ""}`);
  }

  lines.push("", "AI / HEURISTIC EXECUTION PROVENANCE");
  if (!application.aiRuns.length) lines.push("No application-linked AI/heuristic runs recorded yet.");
  for (const run of application.aiRuns) {
    lines.push(`${run.createdAt.toISOString()} | ${run.purpose} | ${run.provider}${run.model ? `/${run.model}` : ""} | ${run.status}${run.usedFallback ? " | FALLBACK" : ""} | ${run.durationMs}ms`);
    lines.push(`  Prompt ${run.promptVersion} | input SHA-256 ${run.inputSha256} | output SHA-256 ${run.outputSha256 ?? "—"}`);
  }

  lines.push(
    "",
    "GOVERNANCE",
    "This packet is a decision-support record. DrishtiRecruit does not make the final hiring decision. Human reviewers remain responsible for evaluating job-related evidence and applying the employer's approved policy.",
  );
  return lines;
}
