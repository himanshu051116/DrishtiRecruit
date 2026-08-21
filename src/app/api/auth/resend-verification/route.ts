import { requireUser } from "@/lib/auth/rbac";
import { assertSameOrigin } from "@/lib/http/security";
import { ok } from "@/lib/http/route";

export async function POST(request: Request) {
  assertSameOrigin(request);
  await requireUser();
  return ok({ verificationRequired: false });
}
