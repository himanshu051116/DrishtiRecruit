import { EvidenceSourceType, EvidenceStrength } from "./enums";

export interface ScoringConfig {
  sourceReliability: Record<EvidenceSourceType, number>;
  strengthValue: Record<EvidenceStrength, number>;
  minimumEvidenceThreshold: Record<EvidenceStrength, number>;
  verifiedEvidenceBoost: number;
  contradictionPenalty: number;
  verifiedDecisionThreshold: number;
}

// Hackathon defaults only. These are intentionally explicit/configurable,
// not represented as scientifically validated hiring constants.
export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  sourceReliability: {
    [EvidenceSourceType.CANDIDATE]: 0.30,
    [EvidenceSourceType.RESUME]: 0.45,
    [EvidenceSourceType.PORTFOLIO]: 0.60,
    [EvidenceSourceType.INTERVIEW]: 0.75,
    [EvidenceSourceType.RECRUITER]: 0.80,
    [EvidenceSourceType.ASSESSMENT]: 0.85,
  },
  strengthValue: {
    [EvidenceStrength.WEAK]: 0.35,
    [EvidenceStrength.MEDIUM]: 0.65,
    [EvidenceStrength.STRONG]: 1.0,
  },
  minimumEvidenceThreshold: {
    [EvidenceStrength.WEAK]: 0.35,
    [EvidenceStrength.MEDIUM]: 0.60,
    [EvidenceStrength.STRONG]: 0.80,
  },
  verifiedEvidenceBoost: 1.08,
  contradictionPenalty: 0.60,
  verifiedDecisionThreshold: 85,
};
