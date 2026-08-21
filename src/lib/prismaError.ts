export function hasPrismaCode(error: unknown, code: string) {
  if (!error || typeof error !== "object") return false;
  return "code" in error && (error as { code?: unknown }).code === code;
}
