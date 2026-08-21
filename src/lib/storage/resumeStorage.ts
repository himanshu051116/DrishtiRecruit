import { createHash, randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const MAX_RESUME_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

function safeBaseName(name: string) {
  return path.basename(name).replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "resume";
}

function hasPdfMagic(buffer: Buffer) {
  return buffer.subarray(0, 5).toString("ascii") === "%PDF-";
}

function hasZipMagic(buffer: Buffer) {
  return buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4b && [0x03, 0x05, 0x07].includes(buffer[2]) && [0x04, 0x06, 0x08].includes(buffer[3]);
}

export type ValidatedResume = {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
};

export async function validateResumeFile(file: File): Promise<ValidatedResume> {
  if (!ALLOWED_MIME.has(file.type)) throw new Response("Only PDF and DOCX resumes are supported", { status: 415 });
  if (file.size <= 0 || file.size > MAX_RESUME_BYTES) throw new Response("Resume must be between 1 byte and 10 MB", { status: 413 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const isPdf = file.type === "application/pdf";
  if (isPdf && !hasPdfMagic(buffer)) throw new Response("Invalid PDF signature", { status: 415 });
  if (!isPdf && !hasZipMagic(buffer)) throw new Response("Invalid DOCX container", { status: 415 });

  return {
    buffer,
    originalName: safeBaseName(file.name),
    mimeType: file.type,
    sizeBytes: buffer.length,
    sha256: createHash("sha256").update(buffer).digest("hex"),
  };
}

export async function storeResumeLocal(candidateId: string, resume: ValidatedResume) {
  const root = process.env.RESUME_STORAGE_DIR || path.join(process.cwd(), ".tracehire-data", "resumes");
  const directory = path.join(root, candidateId);
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const ext = resume.mimeType === "application/pdf" ? ".pdf" : ".docx";
  const storageKey = `${candidateId}/${randomUUID()}${ext}`;
  const absolutePath = path.join(root, storageKey);
  await writeFile(absolutePath, resume.buffer, { mode: 0o600 });
  return { storageKey, fileUrl: `local://${storageKey}` };
}
