import { access, mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { constants } from "node:fs";
import { prisma } from "@/lib/prisma";
import { APP_VERSION, RELEASE_CHANNEL } from "@/lib/version";

export const dynamic = "force-dynamic";

function requiredProductionConfig() {
  const required = ["DATABASE_URL", "APP_URL", "JWT_SECRET"];
  const missing = process.env.NODE_ENV === "production" ? required.filter((key) => !process.env[key]?.trim()) : [];
  return { required, missing };
}

async function checkStorage() {
  const root = process.env.RESUME_STORAGE_DIR || path.join(process.cwd(), ".tracehire-data", "resumes");
  try {
    await mkdir(root, { recursive: true, mode: 0o700 });
    await access(root, constants.W_OK);
    const probe = path.join(root, `.ready-${process.pid}-${Date.now()}`);
    await writeFile(probe, "ok", { mode: 0o600 });
    await unlink(probe);
    return { ok: true, root };
  } catch {
    return { ok: false, root };
  }
}

export async function GET() {
  const started = Date.now();
  const config = requiredProductionConfig();
  let database = false;
  try { await prisma.$queryRaw`SELECT 1`; database = true; } catch { database = false; }
  const storage = await checkStorage();
  const ready = database && storage.ok && config.missing.length === 0;
  return Response.json({
    status: ready ? "ready" : "not_ready",
    version: APP_VERSION,
    releaseChannel: RELEASE_CHANNEL,
    checks: { database, storageWritable: storage.ok, missingConfiguration: config.missing },
    latencyMs: Date.now() - started,
    timestamp: new Date().toISOString(),
  }, { status: ready ? 200 : 503, headers: { "cache-control": "no-store" } });
}
