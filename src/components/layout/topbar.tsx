"use client";

import { Bell, Search, ChevronDown, Activity } from "lucide-react";
import { useState, useTransition } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { switchRoleAction } from "@/app/(app)/actions";
import type { Role } from "@/lib/auth";

export function Topbar({
  user,
  role,
}: {
  user: { name: string; email: string };
  role: Role;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-slate-200 bg-white/90 px-6 backdrop-blur">
      <div className="hidden flex-1 items-center md:flex">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            placeholder="Search runs, leads, prompts…"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:outline-none"
          />
        </div>
      </div>
      <div className="ml-auto flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs sm:flex">
          <Activity className="h-3.5 w-3.5 text-emerald-500" />
          <span className="font-medium text-slate-700">All systems operational</span>
        </div>
        <button className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500" />
        </button>
        <div className="relative">
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white py-1.5 pl-1.5 pr-2.5 hover:bg-slate-50"
          >
            <Avatar name={user.name} size="sm" />
            <div className="hidden text-left leading-tight md:block">
              <p className="text-sm font-medium text-slate-900">{user.name}</p>
              <Badge tone={role === "ADMIN" ? "purple" : role === "OPERATOR" ? "info" : "neutral"}>
                {role}
              </Badge>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>
          {open && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
              <div className="px-3 py-2">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Switch demo role
                </p>
              </div>
              {(["ADMIN", "OPERATOR", "VIEWER"] as Role[]).map((r) => (
                <button
                  key={r}
                  disabled={pending}
                  onClick={() =>
                    start(async () => {
                      await switchRoleAction(r);
                      setOpen(false);
                    })
                  }
                  className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-slate-50"
                >
                  <span>{r === "ADMIN" ? "Admin" : r === "OPERATOR" ? "Operator" : "Viewer"}</span>
                  {r === role && <Badge tone="success">active</Badge>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
