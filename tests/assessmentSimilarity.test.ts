import { describe, expect, it } from "vitest";
import { textSimilarity } from "../src/services/assessment/similarity.js";

describe("assessment similarity review signal", () => {
  it("flags materially overlapping long answers without calling it plagiarism", () => {
    const a = `function reserve(stock, requested) { if (requested <= 0) throw new Error('invalid'); if (stock < requested) return false; const remaining = stock - requested; return { ok: true, remaining }; } transaction commit idempotency reservation release timeout webhook duplicate payment`;
    const b = `function reserve(stock, requested) { if (requested <= 0) throw new Error('invalid'); if (stock < requested) return false; const remaining = stock - requested; return { ok: true, remaining }; } transaction commit idempotency reservation release timeout webhook duplicate payment extra`;
    const result = textSimilarity(a, b);
    expect(result.comparable).toBe(true);
    expect(result.similarity).toBeGreaterThan(0.8);
  });
  it("does not compare very short answers", () => {
    expect(textSimilarity("SELECT 1", "SELECT 1").comparable).toBe(false);
  });
});
