import { sha256Json, sha256Text } from "@/lib/integrity/canonicalJson";

export type AiTraceContext = {
  companyId?: string;
  jobId?: string;
  applicationId?: string;
  actorId?: string;
  purpose: "REQUIREMENT_EXTRACTION" | "RESUME_EVIDENCE_EXTRACTION" | "INTERVIEW_QUESTION_DRAFTING";
  promptVersion: string;
};

type AiRunRecord = AiTraceContext & {
  provider: "OPENAI" | "HEURISTIC" | "OPENAI_TO_HEURISTIC";
  model?: string | null;
  input: string;
  output?: unknown;
  status: "SUCCESS" | "FALLBACK" | "FAILED";
  usedFallback: boolean;
  durationMs: number;
  errorClass?: string | null;
};

/**
 * Stores only hashes and operational metadata. Candidate/job text is deliberately
 * not copied into the AI run ledger. Logging failure must never break hiring flow.
 */
export async function recordAiRun(input: AiRunRecord) {
  try {
    const { prisma } = await import("@/lib/prisma");
    await prisma.aiRun.create({
      data: {
        companyId: input.companyId ?? null,
        jobId: input.jobId ?? null,
        applicationId: input.applicationId ?? null,
        actorId: input.actorId ?? null,
        purpose: input.purpose,
        provider: input.provider,
        model: input.model ?? null,
        promptVersion: input.promptVersion,
        inputSha256: sha256Text(input.input),
        outputSha256: input.output === undefined ? null : sha256Json(input.output),
        status: input.status,
        usedFallback: input.usedFallback,
        durationMs: Math.max(0, Math.round(input.durationMs)),
        errorClass: input.errorClass ?? null,
      },
    });
  } catch (error) {
    console.warn("AI run ledger write failed", error instanceof Error ? error.message : "unknown error");
  }
}
