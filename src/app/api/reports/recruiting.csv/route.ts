import { prisma } from "@/lib/prisma";
import { requireVerifiedRole } from "@/lib/auth/rbac";
import { csvCell } from "@/lib/csv";
export async function GET() {
  const user = await requireVerifiedRole("RECRUITER", "HIRING_MANAGER", "ADMIN");
  const applications = await prisma.application.findMany({ where: user.role === "ADMIN" ? {} : { job: { companyId: user.companyId ?? "__none__" } }, include: { job: { include: { company: true } }, candidate: { include: { user: true } }, evaluations: true }, orderBy: { createdAt: "desc" } });
  const rows = [["application_id","company","job","candidate","email","stage","fit_score","evidence_coverage","decision_coverage","verified_criteria","created_at"], ...applications.map((application) => [application.id, application.job.company.name, application.job.title, application.candidate.user.name, application.candidate.user.email, application.stage, application.fitScore ?? "", application.evidenceCoverage ?? "", application.decisionCoverage ?? "", application.evaluations.filter((e)=>e.status === "VERIFIED").length, application.createdAt.toISOString()])];
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
  return new Response(csv, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="drishtirecruit-recruiting-report-${new Date().toISOString().slice(0,10)}.csv"`, "cache-control": "private, no-store" } });
}
