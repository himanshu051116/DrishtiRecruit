import { requirePageUser } from "@/lib/auth/page";
import { prisma } from "@/lib/prisma";
import { TwoFactorSettings } from "@/components/TwoFactorSettings";
import { SessionManager } from "@/components/SessionManager";

export default async function SecurityPage() {
  const session = await requirePageUser();
  const user = await prisma.user.findUnique({ where: { id: session.id }, select: { passwordHash: true, createdAt: true } });
  return <main className="mx-auto max-w-3xl px-6 py-12"><p className="text-sm font-medium text-zinc-500">Account</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Security</h1><p className="mt-2 text-sm leading-6 text-zinc-600">Manage the second factor used before DrishtiRecruit creates an authenticated session.</p><section className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6"><TwoFactorSettings hasPassword={Boolean(user?.passwordHash)}/></section><section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6"><SessionManager/></section></main>;
}
