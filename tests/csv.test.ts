import { describe, expect, it } from "vitest";
import { csvCell, spreadsheetSafeText } from "../src/lib/csv.js";

describe("CSV export safety", () => {
  it("neutralizes spreadsheet formulas from user-controlled text", () => {
    expect(spreadsheetSafeText("=HYPERLINK(\"https://example.test\")")).toBe("'=HYPERLINK(\"https://example.test\")");
    expect(spreadsheetSafeText("+cmd")).toBe("'+cmd");
    expect(spreadsheetSafeText("@SUM(A1:A2)")).toBe("'@SUM(A1:A2)");
  });

  it("quotes embedded CSV quotes", () => {
    expect(csvCell('A "quoted" name')).toBe('"A ""quoted"" name"');
  });
});
