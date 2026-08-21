import { prisma } from "@/lib/prisma";

export async function notifyUser(userId: string, type: string, title: string, body: string) {
  return prisma.notification.create({ data: { userId, type, title, body } });
}

export async function notifyCompanyRoles(
  companyId: string,
  roles: Array<"RECRUITER" | "HIRING_MANAGER" | "INTERVIEWER" | "ADMIN">,
  type: string,
  title: string,
  body: string,
) {
  const users = await prisma.user.findMany({
    where: { companyId, role: { in: roles } },
    select: { id: true },
  });
  if (!users.length) return { count: 0 };
  return prisma.notification.createMany({
    data: users.map((user) => ({ userId: user.id, type, title, body })),
  });
}

export async function markNotificationRead(notificationId: string, userId: string) {
  const found = await prisma.notification.findFirst({ where: { id: notificationId, userId } });
  if (!found) throw new Response("Notification not found", { status: 404 });
  return prisma.notification.update({ where: { id: notificationId }, data: { readAt: new Date() } });
}
