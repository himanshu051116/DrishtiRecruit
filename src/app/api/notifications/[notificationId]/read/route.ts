import { requireUser } from "@/lib/auth/rbac";
import { fail, ok } from "@/lib/http/route";
import { assertSameOrigin } from "@/lib/http/security";
import { markNotificationRead } from "@/services/notification/notificationService";
export async function POST(request: Request, { params }: { params: Promise<{ notificationId: string }> }) { try { assertSameOrigin(request); const user = await requireUser(); const { notificationId } = await params; const notification = await markNotificationRead(notificationId, user.id); return ok({ notification }); } catch (error) { return fail(error); } }
