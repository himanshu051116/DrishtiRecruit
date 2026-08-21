const MAX_EXTRACTED_CHARS = 120_000;

function normalizeText(text: string) {
  return text.replace(/\u0000/g, "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim().slice(0, MAX_EXTRACTED_CHARS);
}

async function extractPdf(buffer: Buffer) {
  const canvas = await import("@napi-rs/canvas");
  // pdfjs-dist expects these browser geometry APIs at module-load time. Vercel's
  // Node runtime does not provide them, while @napi-rs/canvas does.
  Object.assign(globalThis, {
    DOMMatrix: canvas.DOMMatrix,
    ImageData: canvas.ImageData,
    Path2D: canvas.Path2D,
  });
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buffer), useSystemFonts: true });
  const pdf = await loadingTask.promise;
  const pages: string[] = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const line = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .filter(Boolean)
      .join(" ");
    pages.push(line);
    if (pages.join("\n").length >= MAX_EXTRACTED_CHARS) break;
  }
  return normalizeText(pages.join("\n"));
}

async function extractDocx(buffer: Buffer) {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return normalizeText(result.value);
}

export async function extractResumeText(buffer: Buffer, mimeType: string) {
  const text = mimeType === "application/pdf" ? await extractPdf(buffer) : await extractDocx(buffer);
  if (text.length < 20) throw new Response("Resume text could not be extracted", { status: 422 });
  return text;
}
