import { z } from "zod";
import { verifyEmailToken } from "@/lib/auth/verification";
import { assertSameOrigin, clientAddress, rateLimit } from "@/lib/http/security";
import { fail, ok } from "@/lib/http/route";
const Schema = z.object({ token: z.string().min(20).max(200) });
export async function POST(request: Request) {
  try {
    assertSameOrigin(request); rateLimit(`verify-email:${clientAddress(request)}`, 20, 60_000);
    const { token } = Schema.parse(await request.json());
    if (!(await verifyEmailToken(token))) return Response.json({ ok: false, error: "INVALID_OR_EXPIRED_TOKEN" }, { status: 400 });
    return ok({ verified: true });
  } catch (error) { return fail(error); }
}
