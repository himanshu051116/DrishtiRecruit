import { redirect } from "next/navigation";
import { getSessionUser, type SessionUser } from "./session";

export async function requirePageUser(roles?: SessionUser["role"][]) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (roles && !roles.includes(user.role)) redirect("/dashboard");
  return user;
}
