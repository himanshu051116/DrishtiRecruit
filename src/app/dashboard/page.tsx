import { redirect } from "next/navigation";
import { requirePageUser } from "@/lib/auth/page";
export default async function Dashboard(){const u=await requirePageUser(); if(u.role==="CANDIDATE") redirect("/candidate/dashboard"); if(u.role==="ADMIN") redirect("/admin"); if(["RECRUITER","HIRING_MANAGER"].includes(u.role)) redirect("/recruiter/dashboard"); if(u.role==="INTERVIEWER") redirect("/interviewer/interviews"); redirect("/");}
