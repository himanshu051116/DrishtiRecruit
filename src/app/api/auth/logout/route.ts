import { revokeCurrentSession } from "@/lib/auth/session";
import { assertSameOrigin } from "@/lib/http/security";
import { fail, ok } from "@/lib/http/route";
export async function POST(request: Request) {
  try { assertSameOrigin(request); await revokeCurrentSession(); return ok({ loggedOut: true }); }
  catch (error) { return fail(error); }
}
