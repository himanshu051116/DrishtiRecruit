import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export async function writeAudit(input: {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  await prisma.activityLog.create({
    data: {
      actorId: input.actorId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      metadata: input.metadata as Prisma.InputJsonObject | undefined,
    },
  });
}
