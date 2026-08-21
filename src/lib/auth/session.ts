import { cookies, headers } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
import { prisma } from "@/lib/prisma";

const COOKIE = "tracehire_session";
const SESSION_DAYS = 7;

function secret() {
  const value = process.env.JWT_SECRET;
  if (!value || value.length < 32) throw new Error("JWT_SECRET must contain at least 32 characters");
  return new TextEncoder().encode(value);
}

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: "CANDIDATE" | "RECRUITER" | "HIRING_MANAGER" | "INTERVIEWER" | "ADMIN";
  companyId: string | null;
  emailVerified: boolean;
};

export async function createSession(user: SessionUser) {
  const h = await headers();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const dbSession = await prisma.authSession.create({
    data: { userId: user.id, expiresAt, userAgent: h.get("user-agent")?.slice(0, 500) },
  });

  const token = await new SignJWT({ role: user.role, sid: dbSession.id })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .sign(secret());

  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
    priority: "high",
  });
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    const userId = payload.sub;
    const sid = typeof payload.sid === "string" ? payload.sid : null;
    if (!userId || !sid) return null;

    const session = await prisma.authSession.findUnique({ where: { id: sid }, include: { user: true } });
    if (!session || session.userId !== userId || session.revokedAt || session.expiresAt <= new Date() || !session.user.isActive) return null;
    if (Date.now() - session.lastSeenAt.getTime() > 5 * 60 * 1000) {
      await prisma.authSession.updateMany({ where: { id: session.id, revokedAt: null }, data: { lastSeenAt: new Date() } });
    }

    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
      companyId: session.user.companyId,
      emailVerified: Boolean(session.user.emailVerifiedAt),
    };
  } catch {
    return null;
  }
}

export async function revokeCurrentSession() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
      if (typeof payload.sid === "string") {
        await prisma.authSession.updateMany({ where: { id: payload.sid }, data: { revokedAt: new Date() } });
      }
    } catch {}
  }
  store.delete(COOKIE);
}


export async function getCurrentSessionId() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    return typeof payload.sid === "string" ? payload.sid : null;
  } catch {
    return null;
  }
}
