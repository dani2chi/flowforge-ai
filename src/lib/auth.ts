import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";

export type Role = "ADMIN" | "OPERATOR" | "VIEWER";
export const ROLES: Role[] = ["ADMIN", "OPERATOR", "VIEWER"];

const COOKIE = "flowforge_demo_role";

export async function setDemoRole(role: Role) {
  const store = await cookies();
  store.set(COOKIE, role, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearDemoRole() {
  const store = await cookies();
  store.delete(COOKIE);
}

export async function getCurrentRole(): Promise<Role | null> {
  const store = await cookies();
  const v = store.get(COOKIE)?.value;
  if (v === "ADMIN" || v === "OPERATOR" || v === "VIEWER") return v;
  return null;
}

export async function getCurrentSession() {
  const role = await getCurrentRole();
  if (!role) return null;
  const user = await db.user.findFirst({ where: { role } });
  if (!user) return null;
  return { role, user };
}

export async function requireSession() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  return session;
}
