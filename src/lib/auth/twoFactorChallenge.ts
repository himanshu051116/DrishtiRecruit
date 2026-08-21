import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";

const COOKIE = "tracehire_2fa_challenge";
const MAX_AGE_SECONDS = 5 * 60;

function secret() {
  const value = process.env.JWT_SECRET;
  if (!value || value.length < 32) throw new Error("JWT_SECRET must contain at least 32 characters");
  return new TextEncoder().encode(value);
}

export async function beginTwoFactorChallenge(userId: string) {
  const token = await new SignJWT({ purpose: "two-factor-login" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS)
    .sign(secret());
  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
    priority: "high",
  });
}

export async function readTwoFactorChallenge() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    if (payload.purpose !== "two-factor-login" || !payload.sub) return null;
    return payload.sub;
  } catch {
    return null;
  }
}

export async function clearTwoFactorChallenge() {
  const store = await cookies();
  store.delete(COOKIE);
}
