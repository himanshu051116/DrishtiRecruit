import { getSessionUser } from "@/lib/auth/session";
import { ok } from "@/lib/http/route";
export async function GET() { return ok(await getSessionUser()); }
