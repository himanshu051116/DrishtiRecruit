import { requireVerifiedRole, assertSameCompany } from "@/lib/auth/rbac";
import { buildPaginatedTextPdf } from "@/lib/pdf/simplePdf";
import { fail } from "@/lib/http/route";
import { buildDecisionPacketLines, getDecisionPacketData } from "@/services/reporting/decisionPacket";

export async function GET(_request: Request, { params }: { params: Promise<{ applicationId: string }> }) {
  try {
    const user = await requireVerifiedRole("RECRUITER", "HIRING_MANAGER", "ADMIN");
    const { applicationId } = await params;
    const application = await getDecisionPacketData(applicationId);
    assertSameCompany(user, application.job.companyId);
    const pdf = buildPaginatedTextPdf(buildDecisionPacketLines(application), { maxChars: 88, linesPerPage: 48 });
    const safeRole = application.job.title.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "role";
    return new Response(new Uint8Array(pdf), {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="drishtirecruit-decision-packet-${safeRole}-${application.id}.pdf"`,
        "cache-control": "private, no-store",
      },
    });
  } catch (error) {
    return fail(error);
  }
}
