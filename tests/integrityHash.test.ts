import { describe, expect, it } from "vitest";
import { canonicalJson, sha256Json } from "../src/lib/integrity/canonicalJson.js";

describe("decision snapshot hashing", () => {
  it("is stable across object key order", () => {
    const a = { b: 2, a: { y: 2, x: 1 } };
    const b = { a: { x: 1, y: 2 }, b: 2 };
    expect(canonicalJson(a)).toBe(canonicalJson(b));
    expect(sha256Json(a)).toBe(sha256Json(b));
  });

  it("changes when evidence content changes", () => {
    expect(sha256Json({ fit: 80, evidence: ["A"] })).not.toBe(sha256Json({ fit: 80, evidence: ["B"] }));
  });
});
