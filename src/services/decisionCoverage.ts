import { CriterionStatus, DecisionReadiness, RequirementPriority } from "@/domain/enums";
import type { DecisionCoverageResult, EvidenceItem, JobRequirement } from "@/domain/types";
import type { ScoringConfig } from "@/domain/config";
import { DEFAULT_SCORING_CONFIG } from "@/domain/config";
import { evaluateCriterion, PRIORITY_MULTIPLIER } from "@/lib/scoring";

const FACTOR:Record<CriterionStatus,number> = { VERIFIED:1, PARTIAL:.6, WEAK:.25, MISSING:0, CONFLICTING:.2, OPTIONAL:1 };
const round=(x:number)=>Math.round(x*100)/100;

export function calculateDecisionCoverage(
  reqs:JobRequirement[],
  evidence:EvidenceItem[],
  config:ScoringConfig=DEFAULT_SCORING_CONFIG,
):DecisionCoverageResult {
  const approved=reqs.filter(r=>r.recruiterApproved);
  const criteria=approved.map(r=>evaluateCriterion(r,evidence,config));
  const map=new Map(criteria.map(c=>[c.requirementId,c]));

  let fitNum=0, fitDen=0, evNum=0, evDen=0, decNum=0, decDen=0;
  const must=approved.filter(r=>r.priority===RequirementPriority.MUST_HAVE);
  const unresolved:string[]=[]; const conflicting:string[]=[];

  for(const r of approved){
    const e=map.get(r.id)!;
    const w=r.weight*PRIORITY_MULTIPLIER[r.priority];
    fitNum += e.fitScore*w; fitDen += w;
    evNum += e.evidenceCoverage*w; evDen += w;

    // Preferred criteria affect fit, but do not make a hiring process "incomplete".
    if (r.priority !== RequirementPriority.PREFERRED) {
      decNum += FACTOR[e.status]*100*w; decDen += w;
    }

    if(r.priority===RequirementPriority.MUST_HAVE){
      if([CriterionStatus.MISSING,CriterionStatus.WEAK,CriterionStatus.PARTIAL].includes(e.status)) unresolved.push(r.name);
      if(e.status===CriterionStatus.CONFLICTING) conflicting.push(r.name);
    }
  }

  const verified=must.filter(r=>map.get(r.id)?.status===CriterionStatus.VERIFIED).length;
  const fit=fitDen?fitNum/fitDen:0;
  const cov=evDen?evNum/evDen:0;
  const dec=decDen?decNum/decDen:100;

  let readiness:DecisionReadiness;
  if(conflicting.length) readiness=DecisionReadiness.REVIEW_REQUIRED;
  else if(unresolved.length) readiness=DecisionReadiness.NOT_READY;
  else if(dec<config.verifiedDecisionThreshold) readiness=DecisionReadiness.REVIEW_REQUIRED;
  else readiness=DecisionReadiness.READY;

  return { fitScore:round(fit), evidenceCoverage:round(cov), decisionCoverage:round(dec), verifiedMustHaves:verified, totalMustHaves:must.length, unresolvedMustHaves:unresolved, conflictingMustHaves:conflicting, readiness, criteria };
}
