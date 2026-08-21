import { requirePageUser } from "@/lib/auth/page";
import { prisma } from "@/lib/prisma";
import { OfferResponseActions } from "@/components/OfferResponseActions";

export default async function CandidateOffersPage() {
  const user = await requirePageUser(["CANDIDATE"]);
  const candidate = await prisma.candidateProfile.findUnique({ where: { userId: user.id } });
  const offers = candidate ? await prisma.offerLetter.findMany({ where: { application: { candidateId: candidate.id } }, include: { application: { include: { job: { include: { company: true } } } } }, orderBy: { createdAt: "desc" } }) : [];
  return <main className="mx-auto max-w-5xl px-6 py-10"><div><p className="text-sm text-zinc-500">Candidate portal</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Offers</h1></div><div className="mt-8 space-y-4">{offers.length === 0 ? <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-sm text-zinc-500">No offer letters yet.</div> : offers.map((offer) => <section key={offer.id} className="rounded-2xl border border-zinc-200 bg-white p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm text-zinc-500">{offer.application.job.company.name}</p><h2 className="mt-1 text-xl font-semibold">{offer.roleTitle}</h2><p className="mt-2 text-sm text-zinc-600">{offer.location ?? offer.application.job.location ?? "Location to be confirmed"} · {offer.salary ? `INR ${Number(offer.salary).toLocaleString("en-IN")}` : "Compensation as discussed"}</p></div><span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium">{offer.status}</span></div><div className="mt-5 flex flex-wrap items-center gap-3"><a href={`/api/offers/${offer.id}/pdf`} className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium">Download PDF</a>{offer.status === "SENT" && <OfferResponseActions offerId={offer.id}/>}</div></section>)}</div></main>;
}
