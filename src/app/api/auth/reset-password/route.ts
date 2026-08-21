import { ResetPasswordSchema } from "@/validation/api";
import { resetPassword } from "@/lib/auth/passwordReset";
import { assertSameOrigin, clientAddress, rateLimit } from "@/lib/http/security";
import { fail, ok } from "@/lib/http/route";
export async function POST(request: Request) { try { assertSameOrigin(request); rateLimit(`reset:${clientAddress(request)}`, 10, 60_000); const input = ResetPasswordSchema.parse(await request.json()); const success = await resetPassword(input.token, input.password); if (!success) return Response.json({ ok: false, error: "INVALID_OR_EXPIRED_TOKEN" }, { status: 400 }); return ok({ reset: true }); } catch (error) { return fail(error); } }
