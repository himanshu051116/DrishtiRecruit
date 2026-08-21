import { buildPaginatedTextPdf } from "../src/lib/pdf/simplePdf.ts";

const pdf = buildPaginatedTextPdf(Array.from({ length: 105 }, (_, index) => `Evidence line ${index + 1}`), { linesPerPage: 40 });
const text = pdf.toString("ascii");
const failures = [];
if (!text.startsWith("%PDF-1.4")) failures.push("missing PDF header");
if (!text.includes("/Count 3")) failures.push("expected three-page pagination");
if (!text.includes("Evidence line 105")) failures.push("last evidence line missing");
if (!text.endsWith("%%EOF\n")) failures.push("missing PDF EOF marker");
if (failures.length) {
  console.error(`PDF smoke failed: ${failures.join(", ")}`);
  process.exit(1);
}
console.log(`PDF smoke passed: ${pdf.length} bytes, three pages.`);
