import { prisma } from "@/lib/prisma";
import { APP_VERSION, RELEASE_CHANNEL } from "@/lib/version";

export const dynamic = "force-dynamic";

export async function GET() {
  const started = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({
      status: "ok",
      database: "reachable",
      version: APP_VERSION,
      releaseChannel: RELEASE_CHANNEL,
      latencyMs: Date.now() - started,
      timestamp: new Date().toISOString(),
    }, { headers: { "cache-control": "no-store" } });
  } catch {
    return Response.json({
      status: "degraded",
      database: "unreachable",
      version: APP_VERSION,
      releaseChannel: RELEASE_CHANNEL,
      timestamp: new Date().toISOString(),
    }, { status: 503, headers: { "cache-control": "no-store" } });
  }
}
