import { describe, expect, it } from "vitest";
import { HttpUrlSchema, OptionalHttpUrlSchema } from "../src/validation/common.js";

describe("external URL validation", () => {
  it("allows ordinary http/https URLs", () => {
    expect(HttpUrlSchema.safeParse("https://meet.example.test/room").success).toBe(true);
    expect(HttpUrlSchema.safeParse("http://localhost:3000").success).toBe(true);
  });

  it("rejects executable and non-web URL schemes", () => {
    expect(HttpUrlSchema.safeParse("javascript:alert(1)").success).toBe(false);
    expect(HttpUrlSchema.safeParse("data:text/html,hello").success).toBe(false);
    expect(HttpUrlSchema.safeParse("file:///etc/passwd").success).toBe(false);
  });

  it("allows an empty optional form value", () => {
    expect(OptionalHttpUrlSchema.safeParse("").success).toBe(true);
  });
});
