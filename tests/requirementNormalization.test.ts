import { describe, expect, it } from "vitest";
import { extractRequirementDrafts } from "../src/services/ai/requirementExtractor.js";

describe("requirement extraction normalization", () => {
  it("returns relative weights that stay approximately normalized in heuristic mode", async () => {
    const previous = process.env.AI_PROVIDER;
    process.env.AI_PROVIDER = "heuristic";
    const requirements = await extractRequirementDrafts("Node.js and PostgreSQL are required. Docker is preferred. Communication is important.");
    const total = requirements.reduce((sum, item) => sum + item.weight, 0);
    expect(total).toBeGreaterThan(0.99);
    expect(total).toBeLessThan(1.01);
    expect(new Set(requirements.map((item) => item.name.toLowerCase().replace(/[^a-z0-9]+/g, ""))).size).toBe(requirements.length);
    if (previous === undefined) delete process.env.AI_PROVIDER; else process.env.AI_PROVIDER = previous;
  });
});
