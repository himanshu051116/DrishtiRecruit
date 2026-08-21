import { prisma } from "@/lib/prisma";

export async function sendTransactionalEmail(input: { to: string; subject: string; text: string; template?: string }) {
  const message = await prisma.emailMessage.create({ data: { recipient: input.to, subject: input.subject, textBody: input.text, template: input.template, status: "QUEUED" } });
  const endpoint = process.env.EMAIL_WEBHOOK_URL;
  if (!endpoint) return { message, delivered: false, mode: "outbox" as const };
  try {
    const response = await fetch(endpoint, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ to: input.to, subject: input.subject, text: input.text, template: input.template }), cache: "no-store" });
    if (!response.ok) throw new Error(`Email webhook returned ${response.status}`);
    const updated = await prisma.emailMessage.update({ where: { id: message.id }, data: { status: "SENT", sentAt: new Date() } });
    return { message: updated, delivered: true, mode: "webhook" as const };
  } catch (error) {
    const reason = error instanceof Error ? error.message.slice(0, 1000) : "Unknown delivery failure";
    const updated = await prisma.emailMessage.update({ where: { id: message.id }, data: { status: "FAILED", lastError: reason } });
    return { message: updated, delivered: false, mode: "webhook" as const };
  }
}
