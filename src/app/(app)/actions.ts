"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { setDemoRole, clearDemoRole, type Role } from "@/lib/auth";
import { db } from "@/lib/db";

export async function switchRoleAction(role: Role) {
  await setDemoRole(role);
  revalidatePath("/", "layout");
}

export async function logoutAction() {
  await clearDemoRole();
  redirect("/login");
}

export async function approveRunAction(runId: string) {
  await db.automationRun.update({
    where: { id: runId },
    data: { status: "APPROVED", completedAt: new Date() },
  });
  revalidatePath("/review");
  revalidatePath("/dashboard");
  revalidatePath("/leads");
}

export async function rejectRunAction(runId: string) {
  await db.automationRun.update({
    where: { id: runId },
    data: { status: "REJECTED", completedAt: new Date() },
  });
  revalidatePath("/review");
}
