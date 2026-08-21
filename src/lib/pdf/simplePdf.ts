function escapePdfText(value: string) {
  return value
    .replace(/[^\x20-\x7E]/g, "?")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function wrapLine(value: string, maxChars = 88) {
  const normalized = value.replace(/\s+/g, " ").trimEnd();
  if (!normalized) return [""];
  const prefix = normalized.match(/^\s*/)?.[0] ?? "";
  const text = normalized.trimStart();
  const words = text.split(" ");
  const lines: string[] = [];
  let current = prefix;
  for (const word of words) {
    const candidate = current.trim().length ? `${current} ${word}` : `${prefix}${word}`;
    if (candidate.length > maxChars && current.trim().length) {
      lines.push(current);
      current = `${prefix}${word}`;
    } else {
      current = candidate;
    }
  }
  if (current.length) lines.push(current);
  return lines;
}

function contentStream(lines: string[]) {
  return [
    "BT",
    "/F1 10 Tf",
    "46 798 Td",
    "14 TL",
    ...lines.flatMap((line, index) =>
      index === 0
        ? [`(${escapePdfText(line)}) Tj`]
        : ["T*", `(${escapePdfText(line)}) Tj`],
    ),
    "ET",
  ].join("\n");
}

/**
 * Build a dependency-free text PDF suitable for hackathon exports and offer
 * letters. It intentionally supports ASCII text only and paginates long reports
 * rather than silently overflowing the page.
 */
export function buildPaginatedTextPdf(inputLines: string[], options?: { maxChars?: number; linesPerPage?: number }) {
  const maxChars = options?.maxChars ?? 88;
  const linesPerPage = options?.linesPerPage ?? 50;
  const wrapped = inputLines.flatMap((line) => wrapLine(line, maxChars));
  const pages: string[][] = [];
  for (let index = 0; index < wrapped.length; index += linesPerPage) {
    pages.push(wrapped.slice(index, index + linesPerPage));
  }
  if (pages.length === 0) pages.push([""]);

  // Object numbers:
  // 1 Catalog, 2 Pages, 3 Font, then Page/Content pairs from 4 onward.
  const pageObjectNumbers = pages.map((_, index) => 4 + index * 2);
  const objects = new Map<number, string>();
  objects.set(1, "<< /Type /Catalog /Pages 2 0 R >>");
  objects.set(2, `<< /Type /Pages /Kids [${pageObjectNumbers.map((n) => `${n} 0 R`).join(" ")}] /Count ${pages.length} >>`);
  objects.set(3, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

  pages.forEach((pageLines, index) => {
    const pageObject = 4 + index * 2;
    const contentObject = pageObject + 1;
    const content = contentStream(pageLines);
    objects.set(pageObject, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentObject} 0 R >>`);
    objects.set(contentObject, `<< /Length ${Buffer.byteLength(content, "ascii")} >>\nstream\n${content}\nendstream`);
  });

  const maxObject = Math.max(...objects.keys());
  let body = "%PDF-1.4\n";
  const offsets = new Array<number>(maxObject + 1).fill(0);
  for (let objectNumber = 1; objectNumber <= maxObject; objectNumber++) {
    const object = objects.get(objectNumber);
    if (!object) throw new Error(`Missing PDF object ${objectNumber}`);
    offsets[objectNumber] = Buffer.byteLength(body, "ascii");
    body += `${objectNumber} 0 obj\n${object}\nendobj\n`;
  }

  const xrefOffset = Buffer.byteLength(body, "ascii");
  body += `xref\n0 ${maxObject + 1}\n0000000000 65535 f \n`;
  for (let objectNumber = 1; objectNumber <= maxObject; objectNumber++) {
    body += `${offsets[objectNumber].toString().padStart(10, "0")} 00000 n \n`;
  }
  body += `trailer\n<< /Size ${maxObject + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(body, "ascii");
}

export function buildSimpleTextPdf(lines: string[]) {
  return buildPaginatedTextPdf(lines, { maxChars: 88, linesPerPage: 50 });
}
