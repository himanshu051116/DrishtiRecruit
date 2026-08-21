import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";

export function generateRecoveryCodes(count = 8) {
  return Array.from({ length: count }, () => randomBytes(7).toString("base64url").replace(/[-_]/g, "").slice(0, 10).toUpperCase());
}

export async function hashRecoveryCodes(codes: string[]) {
  return Promise.all(codes.map((code) => bcrypt.hash(code, 10)));
}

export async function findRecoveryCodeIndex(code: string, hashes: string[]) {
  const normalized = code.trim().toUpperCase();
  for (let index = 0; index < hashes.length; index += 1) {
    if (await bcrypt.compare(normalized, hashes[index])) return index;
  }
  return -1;
}
