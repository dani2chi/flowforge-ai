"use server";

import { redirect } from "next/navigation";
import { setDemoRole, type Role } from "@/lib/auth";

export async function loginAsAction(role: Role) {
  await setDemoRole(role);
  redirect("/dashboard");
}
