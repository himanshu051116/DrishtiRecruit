import { describe, expect, it } from "vitest";
import { buildOtpAuthUri, decryptTotpSecret, encryptTotpSecret, generateTotpSecret, totpCode, verifyTotp } from "../src/lib/auth/totp.js";
import { generateRecoveryCodes } from "../src/lib/auth/recoveryCodes.js";

describe("TOTP", () => {
  it("generates and verifies a time-based code within the configured window", () => {
    const secret = generateTotpSecret();
    const at = 1_700_000_000_000;
    const code = totpCode(secret, at);
    expect(code).toMatch(/^\d{6}$/);
    expect(verifyTotp(secret, code, at)).toBe(true);
    expect(verifyTotp(secret, code, at + 90_000)).toBe(false);
  });

  it("encrypts the authenticator secret at rest", () => {
    process.env.JWT_SECRET = "test-secret-that-is-definitely-more-than-thirty-two-characters";
    const secret = generateTotpSecret();
    const encrypted = encryptTotpSecret(secret);
    expect(encrypted).not.toContain(secret);
    expect(decryptTotpSecret(encrypted)).toBe(secret);
  });

  it("creates an authenticator-compatible URI and distinct recovery codes", () => {
    const secret = generateTotpSecret();
    const uri = buildOtpAuthUri(secret, "candidate@example.com");
    expect(uri).toContain("otpauth://totp/");
    expect(uri).toContain(`secret=${secret}`);
    const codes = generateRecoveryCodes();
    expect(new Set(codes).size).toBe(codes.length);
  });
});
