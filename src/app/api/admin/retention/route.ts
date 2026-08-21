import { requireVerifiedRole } from "@/lib/auth/rbac";
import { assertSameOrigin } from "@/lib/http/security";
import { fail, ok } from "@/lib/http/route";
import { writeAudit } from "@/lib/audit";
import { getRetentionPreview, runOperationalRetentionCleanup } from "@/services/privacy/retentionService";

export const dynamic = "force-dynamic";

export async function GET() {
  try { await requireVerifiedRole("ADMIN"); return ok(await getRetentionPreview()); }
  catch (error) { return fail(error); }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const admin = await requireVerifiedRole("ADMIN");
    const result = await runOperationalRetentionCleanup();
    await writeAudit({ actorId: admin.id, action: "OPERATIONAL_RETENTION_CLEANUP", entityType: "Setting", metadata: result });
    return ok(result);
  } catch (error) { return fail(error); }
}
