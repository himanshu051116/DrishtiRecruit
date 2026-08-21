import { describe, expect, it } from "vitest";
import { DecisionReadiness, EvidenceSourceType, EvidenceStrength, RequirementCategory, RequirementPriority } from "../src/domain/enums";
import type { EvidenceItem, JobRequirement } from "../src/domain/types";
import { calculateDecisionCoverage } from "../src/services/decisionCoverage";
import { evaluateCriterion } from "../src/lib/scoring";

const req = (id:string,name:string,priority:RequirementPriority,weight:number):JobRequirement => ({
  id,name,category:RequirementCategory.TECHNICAL_SKILL,priority,weight,
  minimumEvidenceLevel:EvidenceStrength.MEDIUM,verificationRequired:priority!==RequirementPriority.PREFERRED,recruiterApproved:true,
});
const ev = (id:string,requirementId:string,sourceType:EvidenceSourceType,strength:EvidenceStrength,confidence:number,verified=false):EvidenceItem => ({
  id,requirementId,sourceType,strength,confidence,supportsRequirement:true,contradictsRequirement:false,verified,
});

describe("DrishtiRecruit scoring",()=>{
  it("separates strong semantic fit from incomplete evidence coverage",()=>{
    const r=req("r-node","Node.js",RequirementPriority.MUST_HAVE,1);
    const result=evaluateCriterion(r,[ev("e1",r.id,EvidenceSourceType.RESUME,EvidenceStrength.STRONG,.9)]);
    expect(result.fitScore).toBeGreaterThan(85);
    expect(result.evidenceCoverage).toBeGreaterThan(60);
    expect(result.evidenceCoverage).toBeLessThan(90);
  });

  it("keeps a candidate not-ready when a must-have is unresolved",()=>{
    const requirements=[req("r-node","Node.js",RequirementPriority.MUST_HAVE,.4),req("r-docker","Docker",RequirementPriority.MUST_HAVE,.3),req("r-sec","Security Design",RequirementPriority.MUST_HAVE,.3)];
    const evidence=[
      ev("e1","r-node",EvidenceSourceType.RESUME,EvidenceStrength.STRONG,.95),
      ev("e2","r-node",EvidenceSourceType.ASSESSMENT,EvidenceStrength.STRONG,.9,true),
      ev("e3","r-docker",EvidenceSourceType.RESUME,EvidenceStrength.STRONG,.88),
    ];
    const result=calculateDecisionCoverage(requirements,evidence);
    expect(result.totalMustHaves).toBe(3);
    expect(result.unresolvedMustHaves).toContain("Security Design");
    expect(result.readiness).toBe(DecisionReadiness.NOT_READY);
    expect(result.fitScore).toBeGreaterThan(0);
    expect(result.decisionCoverage).toBeLessThan(100);
  });
});

describe("DrishtiRecruit decision readiness regressions",()=>{
  it("does not let an unverified preferred criterion make decision coverage incomplete",()=>{
    const requirements=[
      req("r-node","Node.js",RequirementPriority.MUST_HAVE,.8),
      req("r-aws","AWS",RequirementPriority.PREFERRED,.2),
    ];
    const evidence=[
      ev("e1","r-node",EvidenceSourceType.ASSESSMENT,EvidenceStrength.STRONG,1,true),
      ev("e2","r-node",EvidenceSourceType.INTERVIEW,EvidenceStrength.STRONG,1,true),
    ];
    const result=calculateDecisionCoverage(requirements,evidence);
    expect(result.unresolvedMustHaves).toEqual([]);
    expect(result.decisionCoverage).toBeGreaterThanOrEqual(85);
    expect(result.readiness).toBe(DecisionReadiness.READY);
  });

  it("flags materially conflicting must-have evidence for human review",()=>{
    const requirement=req("r-sec","Security Design",RequirementPriority.MUST_HAVE,1);
    const supportive=ev("e1",requirement.id,EvidenceSourceType.INTERVIEW,EvidenceStrength.STRONG,.95,true);
    const contradictory={...ev("e2",requirement.id,EvidenceSourceType.ASSESSMENT,EvidenceStrength.STRONG,.95,true),supportsRequirement:false,contradictsRequirement:true};
    const result=calculateDecisionCoverage([requirement],[supportive,contradictory]);
    expect(result.conflictingMustHaves).toContain("Security Design");
    expect(result.readiness).toBe(DecisionReadiness.REVIEW_REQUIRED);
  });
});
