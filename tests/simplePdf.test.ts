import { describe, expect, it } from "vitest";
import { buildPaginatedTextPdf, buildSimpleTextPdf } from "../src/lib/pdf/simplePdf.js";

describe("text PDF builder", () => {
  it("creates a valid-looking one-page PDF", () => {
    const pdf = buildSimpleTextPdf(["DrishtiRecruit", "Offer letter"]);
    const text = pdf.toString("ascii");
    expect(text.startsWith("%PDF-1.4")).toBe(true);
    expect(text).toContain("/Count 1");
    expect(text.endsWith("%%EOF\n")).toBe(true);
  });

  it("paginates long decision reports", () => {
    const pdf = buildPaginatedTextPdf(Array.from({ length: 105 }, (_, i) => `Evidence line ${i + 1}`), { linesPerPage: 40 });
    const text = pdf.toString("ascii");
    expect(text).toContain("/Count 3");
    expect(text).toContain("Evidence line 105");
  });
});
