import { getSessionUser, type SessionUser } from "./session";

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new Response("Unauthenticated", { status: 401 });
  return user;
}

export async function requireRole(...roles: SessionUser["role"][]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) throw new Response("Forbidden", { status: 403 });
  return user;
}

export async function requireVerifiedRole(...roles: SessionUser["role"][]) {
  const user = await requireRole(...roles);
  if (!user.emailVerified && user.role !== "ADMIN") throw new Response("Email verification required", { status: 403 });
  return user;
}

export function assertSameCompany(user: SessionUser, companyId: string) {
  if (user.role !== "ADMIN" && user.companyId !== companyId) throw new Response("Forbidden", { status: 403 });
}
