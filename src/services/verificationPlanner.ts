import { CriterionStatus, RequirementCategory, VerificationMethod } from "@/domain/enums";
import type { CriterionEvaluation, JobRequirement, VerificationTemplate } from "@/domain/types";
import { PRIORITY_MULTIPLIER } from "@/lib/scoring";

export interface VerificationRecommendation { requirementId:string; requirementName:string; method:VerificationMethod; templateId?:string; priorityScore:number; reason:string }
const GAP:Record<CriterionStatus,number>={VERIFIED:0,PARTIAL:.45,WEAK:.75,MISSING:1,CONFLICTING:.95,OPTIONAL:.25};
const SPECIAL_METHOD: Record<string, VerificationMethod> = { "postgresql": VerificationMethod.SQL, "node.js": VerificationMethod.DEBUGGING, "docker": VerificationMethod.PRACTICAL };

const PREF:Record<RequirementCategory,VerificationMethod[]>={
 TECHNICAL_SKILL:[VerificationMethod.PRACTICAL,VerificationMethod.CODING,VerificationMethod.DEBUGGING,VerificationMethod.MCQ,VerificationMethod.INTERVIEW],
 EXPERIENCE:[VerificationMethod.INTERVIEW,VerificationMethod.DOCUMENT_CHECK,VerificationMethod.HUMAN_REVIEW],
 EDUCATION:[VerificationMethod.DOCUMENT_CHECK,VerificationMethod.HUMAN_REVIEW],
 COMPETENCY:[VerificationMethod.INTERVIEW,VerificationMethod.PRACTICAL,VerificationMethod.HUMAN_REVIEW],
 COMMUNICATION:[VerificationMethod.INTERVIEW,VerificationMethod.HUMAN_REVIEW],
 LEADERSHIP:[VerificationMethod.INTERVIEW,VerificationMethod.HUMAN_REVIEW],
 OTHER:[VerificationMethod.HUMAN_REVIEW,VerificationMethod.INTERVIEW],
};

export function planVerifications(reqs:JobRequirement[], evals:CriterionEvaluation[], templates:VerificationTemplate[]):VerificationRecommendation[]{
 const byId=new Map(evals.map(e=>[e.requirementId,e]));
 const recommendations = reqs.filter(r=>r.recruiterApproved).flatMap<VerificationRecommendation>(r=>{
   const e=byId.get(r.id); if(!e||e.status===CriterionStatus.VERIFIED) return [];
   const priority=r.weight*PRIORITY_MULTIPLIER[r.priority]*GAP[e.status]*(1-e.evidenceCoverage/100);
   const methods=PREF[r.category];
   const special = SPECIAL_METHOD[r.name.toLowerCase()];
   const rankedMethods = special ? [special, ...methods.filter((method) => method !== special)] : methods;
   const candidates=templates.filter(t=>t.active&&t.category===r.category).sort((a,b)=>rankedMethods.indexOf(a.method)-rankedMethods.indexOf(b.method));
   const chosen=e.status===CriterionStatus.CONFLICTING?undefined:candidates[0];
   const method=e.status===CriterionStatus.CONFLICTING?VerificationMethod.HUMAN_REVIEW:(chosen?.method??rankedMethods[0]);
   const reason=e.status===CriterionStatus.CONFLICTING?`${r.name} has conflicting evidence; human review is preferred before further automated verification.`:`${r.name} is ${e.status.toLowerCase()} with ${e.evidenceCoverage}% evidence coverage.`;
   return [{requirementId:r.id,requirementName:r.name,method,templateId:chosen?.id,priorityScore:Math.round(priority*10000)/100,reason}];
 });
 return recommendations.sort((a,b)=>b.priorityScore-a.priorityScore);
}
