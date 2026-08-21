# Scoring Model v0.1

**Fit Score** estimates alignment from current supporting evidence.

**Evidence Coverage** measures sufficiency relative to the requirement's minimum evidence threshold.

**Decision Coverage** measures whether the hiring process has adequately evaluated required criteria.

Evidence contribution = strength × configurable source-reliability × confidence × small verified-evidence boost. Multiple items are aggregated with noisy-OR to avoid linear score inflation. Contradictory evidence lowers fit and can mark a criterion `CONFLICTING`.

Readiness rule: unresolved must-have => `NOT_READY`; conflicting must-have => `REVIEW_REQUIRED`; all must-haves verified but global decision coverage below threshold => `REVIEW_REQUIRED`; otherwise => `READY`. Authorized humans may still proceed, with warnings retained in DecisionTrace.

All constants are starter calibration defaults, not scientifically validated hiring weights. Real deployment requires validation, bias testing, governance, and organization-specific calibration.
