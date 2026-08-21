import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth/session";
import { writeAudit } from "@/lib/audit";
import { beginTwoFactorChallenge } from "@/lib/auth/twoFactorChallenge";

const STATE_COOKIE = "drishtirecruit_google_oauth_state";

type GoogleUserInfo = { sub: string; email: string; email_verified?: boolean; name?: string };

export async function GET(request: Request) {
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return new Response("Google OAuth is not configured", { status: 503 });
  const url = new URL(request.url);
  const code = url.searchParams.get("code"); const state = url.searchParams.get("state");
  const store = await cookies(); const expectedState = store.get(STATE_COOKIE)?.value; store.delete(STATE_COOKIE);
  if (!code || !state || !expectedState || state !== expectedState) return new Response("Invalid OAuth state", { status: 400 });

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: `${appUrl}/api/auth/google/callback`, grant_type: "authorization_code" }),
    cache: "no-store",
  });
  if (!tokenResponse.ok) return new Response("Google token exchange failed", { status: 502 });
  const tokens = await tokenResponse.json() as { access_token?: string };
  if (!tokens.access_token) return new Response("Google access token missing", { status: 502 });
  const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", { headers: { authorization: `Bearer ${tokens.access_token}` }, cache: "no-store" });
  if (!profileResponse.ok) return new Response("Google profile lookup failed", { status: 502 });
  const profile = await profileResponse.json() as GoogleUserInfo;
  if (!profile.email || profile.email_verified !== true) return new Response("A verified Google email is required", { status: 403 });
  const email = profile.email.toLowerCase();

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({ data: { email, name: profile.name?.slice(0, 100) || email.split("@")[0], role: "CANDIDATE", emailVerifiedAt: new Date() } });
      await tx.candidateProfile.create({ data: { userId: created.id, skills: [] } });
      return created;
    });
  } else if (!user.isActive) {
    return new Response("Account is inactive", { status: 403 });
  } else if (!user.emailVerifiedAt) {
    user = await prisma.user.update({ where: { id: user.id }, data: { emailVerifiedAt: new Date() } });
  }
  if (user.twoFactorEnabled) {
    await beginTwoFactorChallenge(user.id);
    await writeAudit({ actorId: user.id, action: "GOOGLE_OAUTH_PRIMARY_VERIFIED", entityType: "User", entityId: user.id });
    return Response.redirect(new URL("/two-factor", appUrl));
  }
  await createSession({ id: user.id, email: user.email, name: user.name, role: user.role, companyId: user.companyId, emailVerified: true });
  await writeAudit({ actorId: user.id, action: "GOOGLE_OAUTH_LOGIN", entityType: "User", entityId: user.id });
  return Response.redirect(new URL("/dashboard", appUrl));
}
