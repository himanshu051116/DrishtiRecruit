import { prisma } from "@/lib/prisma";
import { sha256Json } from "@/lib/integrity/canonicalJson";

export type IntegrityStatus = "PASS" | "WARN" | "FAIL";
export type IntegrityCheck = { id: string; label: string; status: IntegrityStatus; detail: string };

export async function getDecisionIntegrityAudit(applicationId: string) {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      job: { include: { requirements: true } },
      evidence: true,
      evaluations: true,
      decisions: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!application) throw new Response("Application not found", { status: 404 });

  const checks: IntegrityCheck[] = [];
  const approved = application.job.requirements.filter((item) => item.recruiterApproved);
  const approvedIds = new Set(approved.map((item) => item.id));
  const normalizedNames = approved.map((item) => item.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, ""));

  checks.push({
    id: "approved-criteria",
    label: "Recruiter-approved criteria",
    status: approved.length > 0 ? "PASS" : "FAIL",
    detail: approved.length > 0 ? `${approved.length} approved job criterion/criteria drive evaluation.` : "No recruiter-approved criteria are available.",
  });

  checks.push({
    id: "duplicate-criteria",
    label: "Duplicate criterion guard",
    status: new Set(normalizedNames).size === normalizedNames.length ? "PASS" : "FAIL",
    detail: new Set(normalizedNames).size === normalizedNames.length ? "Approved criterion names are structurally unique." : "Equivalent approved criterion names are duplicated.",
  });

  const invalidWeight = approved.some((item) => !Number.isFinite(item.weight) || item.weight <= 0);
  checks.push({
    id: "weights",
    label: "Criterion weighting",
    status: invalidWeight ? "FAIL" : "PASS",
    detail: invalidWeight ? "At least one approved criterion has a non-positive or invalid weight." : `All approved criteria use positive relative weights (total ${approved.reduce((sum, item) => sum + item.weight, 0).toFixed(3)}).`,
  });

  const orphanEvidence = application.evidence.filter((item) => !approvedIds.has(item.requirementId));
  checks.push({
    id: "evidence-linkage",
    label: "Evidence-to-requirement linkage",
    status: orphanEvidence.length ? "FAIL" : "PASS",
    detail: orphanEvidence.length ? `${orphanEvidence.length} evidence item(s) point outside the currently approved role criteria.` : `${application.evidence.length} evidence item(s) are linked to approved criteria.`,
  });

  const missingProvenance = application.evidence.filter((item) => !item.sourceExcerpt?.trim());
  checks.push({
    id: "provenance",
    label: "Evidence provenance",
    status: missingProvenance.length ? "WARN" : "PASS",
    detail: missingProvenance.length ? `${missingProvenance.length} evidence item(s) lack a human-readable source excerpt.` : "Every recorded evidence item has a source excerpt for inspection.",
  });

  const evaluations = new Map(application.evaluations.map((item) => [item.requirementId, item]));
  const stale = approved.filter((requirement) => {
    const evaluation = evaluations.get(requirement.id);
    if (!evaluation) return application.evidence.some((item) => item.requirementId === requirement.id);
    const newestEvidence = application.evidence.filter((item) => item.requirementId === requirement.id).reduce((latest, item) => Math.max(latest, item.createdAt.getTime()), 0);
    return newestEvidence > evaluation.calculatedAt.getTime();
  });
  checks.push({
    id: "freshness",
    label: "Coverage freshness",
    status: stale.length ? "FAIL" : "PASS",
    detail: stale.length ? `Coverage is stale for: ${stale.map((item) => item.name).join(", ")}.` : "Criterion evaluations are not older than their latest evidence.",
  });

  const decisionsWithoutHash = application.decisions.filter((item) => !item.evidenceSnapshotSha256);
  const decisionsWithMismatch = application.decisions.filter((item) => item.evidenceSnapshotSha256 && sha256Json(item.evidenceSnapshot) !== item.evidenceSnapshotSha256);
  checks.push({
    id: "decision-snapshot-integrity",
    label: "Decision snapshot integrity",
    status: decisionsWithMismatch.length ? "FAIL" : decisionsWithoutHash.length ? "WARN" : "PASS",
    detail: decisionsWithMismatch.length
      ? `${decisionsWithMismatch.length} DecisionTrace snapshot hash mismatch(es) detected.`
      : decisionsWithoutHash.length
        ? `${decisionsWithoutHash.length} legacy DecisionTrace record(s) predate snapshot hashing.`
        : application.decisions.length ? "All DecisionTrace evidence snapshots match their stored SHA-256 hashes." : "No human DecisionTrace has been recorded yet.",
  });

  const latest = application.decisions[0] ?? null;
  let terminalStatus: IntegrityStatus = "PASS";
  let terminalDetail = "Current stage is consistent with the latest human decision state.";
  if (application.stage === "REJECTED" && latest?.humanDecision !== "REJECT") { terminalStatus = "FAIL"; terminalDetail = "Application is REJECTED without a matching latest REJECT DecisionTrace."; }
  if (application.stage === "HIRED" && latest?.humanDecision !== "HIRE") { terminalStatus = "FAIL"; terminalDetail = "Application is HIRED without a matching latest HIRE DecisionTrace."; }
  checks.push({ id: "terminal-consistency", label: "Terminal workflow consistency", status: terminalStatus, detail: terminalDetail });

  const aiRuns = await prisma.aiRun.findMany({ where: { applicationId }, orderBy: { createdAt: "desc" }, take: 20 });
  checks.push({
    id: "ai-provenance",
    label: "Processing provenance",
    status: aiRuns.length ? "PASS" : "WARN",
    detail: aiRuns.length ? `${aiRuns.length} recent processing run(s) have hashed input/output provenance and provider metadata.` : "No processing run has been recorded for this application yet.",
  });

  const summary = {
    pass: checks.filter((item) => item.status === "PASS").length,
    warn: checks.filter((item) => item.status === "WARN").length,
    fail: checks.filter((item) => item.status === "FAIL").length,
  };
  return { applicationId, generatedAt: new Date().toISOString(), summary, checks, aiRuns };
}
