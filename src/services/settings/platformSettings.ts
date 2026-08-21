import { prisma } from "@/lib/prisma";

export type PlatformSettings = {
  candidateSelfSchedulingEnabled: boolean;
  maintenanceNotice: string;
  dataRetentionDays: number;
};

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  candidateSelfSchedulingEnabled: true,
  maintenanceNotice: "",
  dataRetentionDays: 365,
};

export async function getPlatformSettings(): Promise<PlatformSettings> {
  const rows = await prisma.setting.findMany({ where: { scope: "PLATFORM", scopeId: "GLOBAL", key: { in: Object.keys(DEFAULT_PLATFORM_SETTINGS) } } });
  const values = { ...DEFAULT_PLATFORM_SETTINGS } as Record<string, unknown>;
  for (const row of rows) values[row.key] = row.value;
  return {
    candidateSelfSchedulingEnabled: Boolean(values.candidateSelfSchedulingEnabled),
    maintenanceNotice: typeof values.maintenanceNotice === "string" ? values.maintenanceNotice : "",
    dataRetentionDays: Number.isFinite(Number(values.dataRetentionDays)) ? Number(values.dataRetentionDays) : DEFAULT_PLATFORM_SETTINGS.dataRetentionDays,
  };
}

export async function updatePlatformSettings(settings: PlatformSettings) {
  await prisma.$transaction(Object.entries(settings).map(([key, value]) => prisma.setting.upsert({
    where: { scope_scopeId_key: { scope: "PLATFORM", scopeId: "GLOBAL", key } },
    create: { scope: "PLATFORM", scopeId: "GLOBAL", key, value },
    update: { value },
  })));
  return settings;
}
