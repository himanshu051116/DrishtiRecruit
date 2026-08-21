import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const STEP_SECONDS = 30;
const DIGITS = 6;

function base32Encode(buffer: Buffer) {
  let bits = 0;
  let value = 0;
  let output = "";
  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += ALPHABET[(value << (5 - bits)) & 31];
  return output;
}

function base32Decode(input: string) {
  const clean = input.toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const char of clean) {
    const index = ALPHABET.indexOf(char);
    if (index < 0) throw new Error("Invalid base32 secret");
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

function encryptionKey() {
  const material = process.env.TWO_FACTOR_ENCRYPTION_KEY || process.env.JWT_SECRET;
  if (!material || material.length < 32) throw new Error("TWO_FACTOR_ENCRYPTION_KEY or JWT_SECRET must contain at least 32 characters");
  return createHash("sha256").update(`tracehire:2fa:${material}`).digest();
}

export function generateTotpSecret() {
  return base32Encode(randomBytes(20));
}

export function buildOtpAuthUri(secret: string, email: string, issuer = "DrishtiRecruit") {
  const label = encodeURIComponent(`${issuer}:${email}`);
  const params = new URLSearchParams({ secret, issuer, algorithm: "SHA1", digits: String(DIGITS), period: String(STEP_SECONDS) });
  return `otpauth://totp/${label}?${params.toString()}`;
}

export function totpCode(secret: string, at = Date.now()) {
  const counter = Math.floor(at / 1000 / STEP_SECONDS);
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac("sha1", base32Decode(secret)).update(counterBuffer).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary = ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);
  return String(binary % 10 ** DIGITS).padStart(DIGITS, "0");
}

export function verifyTotp(secret: string, candidate: string, at = Date.now(), window = 1) {
  const clean = candidate.replace(/\s+/g, "");
  if (!/^\d{6}$/.test(clean)) return false;
  const supplied = Buffer.from(clean);
  for (let drift = -window; drift <= window; drift += 1) {
    const expected = Buffer.from(totpCode(secret, at + drift * STEP_SECONDS * 1000));
    if (expected.length === supplied.length && timingSafeEqual(expected, supplied)) return true;
  }
  return false;
}

export function encryptTotpSecret(secret: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, ciphertext].map((part) => part.toString("base64url")).join(".");
}

export function decryptTotpSecret(value: string) {
  const [ivText, tagText, cipherText] = value.split(".");
  if (!ivText || !tagText || !cipherText) throw new Error("Invalid encrypted 2FA secret");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivText, "base64url"));
  decipher.setAuthTag(Buffer.from(tagText, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(cipherText, "base64url")), decipher.final()]).toString("utf8");
}
