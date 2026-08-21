const buckets = new Map<string, { count: number; resetAt: number }>();
let lastSweep = 0;

function sweepExpired(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, value] of buckets) if (value.resetAt <= now) buckets.delete(key);
}

export function clientAddress(request: Request) {
  const trustProxy = process.env.TRUST_PROXY_HEADERS === "true";
  if (!trustProxy) return "untrusted-proxy";
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  const candidate = forwarded || realIp || "unknown";
  return candidate.slice(0, 120);
}

export function assertSameOrigin(request: Request) {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite === "cross-site") throw new Response("Cross-site mutation blocked", { status: 403 });
  const origin = request.headers.get("origin");
  if (!origin) return;
  const expected = new URL(process.env.APP_URL ?? "http://localhost:3000").origin;
  if (origin !== expected) throw new Response("Invalid origin", { status: 403 });
}

export function rateLimit(key: string, limit = 20, windowMs = 60_000) {
  const now = Date.now();
  sweepExpired(now);
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  current.count += 1;
  if (current.count > limit) {
    const retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    throw new Response("Too many requests", { status: 429, headers: { "retry-after": String(retryAfter) } });
  }
}
