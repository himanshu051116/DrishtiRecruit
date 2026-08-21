import { z } from "zod";
import { requireVerifiedRole } from "@/lib/auth/rbac";
import { assertSameOrigin } from "@/lib/http/security";
import { fail, ok } from "@/lib/http/route";
import { writeAudit } from "@/lib/audit";
import { getPlatformSettings, updatePlatformSettings } from "@/services/settings/platformSettings";

const Schema = z.object({
  candidateSelfSchedulingEnabled: z.boolean(),
  maintenanceNotice: z.string().max(500),
  dataRetentionDays: z.number().int().min(30).max(3650),
});

export async function GET() {
  try { await requireVerifiedRole("ADMIN"); return ok(await getPlatformSettings()); }
  catch (error) { return fail(error); }
}

export async function PATCH(request: Request) {
  try {
    assertSameOrigin(request);
    const admin = await requireVerifiedRole("ADMIN");
    const body = Schema.parse(await request.json());
    const settings = await updatePlatformSettings(body);
    await writeAudit({ actorId: admin.id, action: "PLATFORM_SETTINGS_UPDATED", entityType: "Setting", metadata: body });
    return ok(settings);
  } catch (error) { return fail(error); }
}
