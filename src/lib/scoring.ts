import { CriterionStatus, EvidenceStrength, RequirementPriority } from "@/domain/enums";
import type { CriterionEvaluation, EvidenceItem, JobRequirement } from "@/domain/types";
import type { ScoringConfig } from "@/domain/config";
import { DEFAULT_SCORING_CONFIG } from "@/domain/config";

export const PRIORITY_MULTIPLIER: Record<RequirementPriority, number> = {
  [RequirementPriority.MUST_HAVE]: 1.0,
  [RequirementPriority.IMPORTANT]: 0.75,
  [RequirementPriority.PREFERRED]: 0.40,
};

const clamp = (x: number) => Math.max(0, Math.min(1, x));
const round = (x: number) => Math.round(x * 100) / 100;
const noisyOr = (xs: number[]) => xs.length ? 1 - xs.reduce((a, x) => a * (1 - clamp(x)), 1) : 0;

/**
 * Semantic fit and evidence coverage intentionally use different contribution functions.
 * A resume statement can align strongly with a requirement while still being weakly verified.
 */
export function evaluateCriterion(
  r: JobRequirement,
  all: EvidenceItem[],
  config: ScoringConfig = DEFAULT_SCORING_CONFIG,
): CriterionEvaluation {
  const evidence = all.filter((e) => e.requirementId === r.id);

  const semanticContribution = (e: EvidenceItem) => clamp(
    config.strengthValue[e.strength] * clamp(e.confidence),
  );

  const coverageContribution = (e: EvidenceItem) => clamp(
    semanticContribution(e) *
    config.sourceReliability[e.sourceType] *
    (e.verified ? config.verifiedEvidenceBoost : 1),
  );

  const supportive = evidence.filter((e) => e.supportsRequirement && !e.contradictsRequirement);
  const contradictory = evidence.filter((e) => e.contradictsRequirement);

  const semanticSupport = noisyOr(supportive.map(semanticContribution));
  const semanticContradiction = noisyOr(contradictory.map(semanticContribution));
  const trustedSupport = noisyOr(supportive.map(coverageContribution));
  const trustedContradiction = noisyOr(contradictory.map(coverageContribution));

  const netFit = clamp(semanticSupport - config.contradictionPenalty * semanticContradiction);
  const threshold = config.minimumEvidenceThreshold[r.minimumEvidenceLevel];
  let coverage = clamp(trustedSupport / threshold);

  const sources = new Set(supportive.map((e) => e.sourceType)).size;
  if (sources >= 2) coverage = clamp(coverage + 0.08);
  if (sources >= 3) coverage = clamp(coverage + 0.06);

  // Conflicts require meaningful evidence on both sides. Trusted values prevent a weak
  // self-claim alone from overpowering stronger verification evidence.
  const conflict = trustedContradiction >= 0.25 && trustedSupport >= 0.25 &&
    Math.abs(trustedSupport - trustedContradiction) <= 0.45;

  let status: CriterionStatus;
  if (r.priority === RequirementPriority.PREFERRED && evidence.length === 0) {
    status = CriterionStatus.OPTIONAL;
  } else if (conflict) {
    status = CriterionStatus.CONFLICTING;
  } else if (coverage >= 0.95 && netFit >= 0.55) {
    status = CriterionStatus.VERIFIED;
  } else if (coverage >= 0.60) {
    status = CriterionStatus.PARTIAL;
  } else if (evidence.length) {
    status = CriterionStatus.WEAK;
  } else {
    status = CriterionStatus.MISSING;
  }

  return {
    requirementId: r.id,
    fitScore: round(netFit * 100),
    evidenceCoverage: round(coverage * 100),
    status,
    supportScore: round(semanticSupport),
    contradictionScore: round(semanticContradiction),
    evidenceCount: evidence.length,
    independentSourceCount: sources,
  };
}
