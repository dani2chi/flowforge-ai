import { Sparkles, ShieldCheck, ClipboardCheck, Eye } from "lucide-react";
import { loginAsAction } from "./actions";
import type { Role } from "@/lib/auth";

const ROLES: Array<{
  role: Role;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  accent: string;
}> = [
  {
    role: "ADMIN",
    title: "Admin",
    subtitle: "Avery Lin",
    description: "Configure workflows, edit prompts, manage models, see every run.",
    icon: <ShieldCheck className="h-5 w-5" />,
    accent: "from-violet-500/15 to-violet-500/0 ring-violet-200",
  },
  {
    role: "OPERATOR",
    title: "Operator",
    subtitle: "Mateo Salazar",
    description: "Submit inputs, review AI outputs, approve or edit before send.",
    icon: <ClipboardCheck className="h-5 w-5" />,
    accent: "from-sky-500/15 to-sky-500/0 ring-sky-200",
  },
  {
    role: "VIEWER",
    title: "Viewer",
    subtitle: "Hana Brackett",
    description: "Read-only: completed runs, CRM records, and analytics.",
    icon: <Eye className="h-5 w-5" />,
    accent: "from-slate-500/15 to-slate-500/0 ring-slate-200",
  },
];

export default function LoginPage() {
  return (
    <div className="grid min-h-dvh w-full lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-gradient-to-br from-slate-950 via-violet-950 to-slate-950 p-10 text-white lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-lg font-semibold">FlowForge AI</p>
            <p className="text-xs text-slate-400">Business Workflow Automation</p>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-3xl font-semibold leading-tight">
            Turn messy inputs into reviewed, structured CRM records.
          </h2>
          <p className="max-w-md text-sm text-slate-300">
            FlowForge AI is a portfolio demo of a production-style AI workflow: clean text →
            extract structured fields → validate JSON → score → human review → push to CRM.
          </p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {[
              ["1,284", "automation runs"],
              ["96 hrs", "estimated time saved"],
              ["412", "leads processed"],
              ["91.6%", "first-pass success"],
            ].map(([n, l]) => (
              <div key={l} className="rounded-lg border border-white/10 bg-white/5 p-4">
                <p className="text-2xl font-semibold tabular-nums">{n}</p>
                <p className="text-xs text-slate-400">{l}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-slate-500">
          Mock AI mode · No live LLM calls · Fictional data
        </p>
      </div>

      <div className="flex items-center justify-center bg-slate-50 p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="mb-6 lg:hidden">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              <p className="text-base font-semibold">FlowForge AI</p>
            </div>
          </div>

          <h1 className="text-2xl font-semibold text-slate-900">Sign in</h1>
          <p className="mt-1 text-sm text-slate-600">
            Pick a role to preview FlowForge from that perspective.
          </p>

          <div className="mt-6 space-y-3">
            {ROLES.map((r) => (
              <form key={r.role} action={loginAsAction.bind(null, r.role)}>
                <button
                  type="submit"
                  className="group relative w-full overflow-hidden rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-slate-300 hover:shadow-sm"
                >
                  <div className={`absolute inset-x-0 top-0 h-16 bg-gradient-to-b ${r.accent} opacity-60`} />
                  <div className="relative flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-slate-900 to-slate-700 text-white">
                      {r.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-slate-900">
                          Continue as {r.title}
                        </p>
                        <span className="text-xs font-medium text-slate-400 group-hover:text-slate-600">
                          {r.role}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">{r.subtitle}</p>
                      <p className="mt-1.5 text-xs text-slate-600">{r.description}</p>
                    </div>
                  </div>
                </button>
              </form>
            ))}
          </div>

          <div className="mt-8 rounded-lg border border-dashed border-slate-200 bg-white p-3 text-xs text-slate-500">
            <p className="font-medium text-slate-700">Demo running in mock AI mode.</p>
            <p>Production version supports OpenAI, Anthropic, and on-prem models with managed prompt versioning.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
