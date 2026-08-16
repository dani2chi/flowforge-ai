import { Search, Download } from "lucide-react";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRelativeDate } from "@/lib/utils";

const LEVEL_TONE: Record<string, "neutral" | "info" | "warning" | "danger" | "success"> = {
  INFO: "info",
  WARN: "warning",
  ERROR: "danger",
  SUCCESS: "success",
};

export default async function LogsPage() {
  await requireSession();
  const runs = await db.automationRun.findMany({
    where: { inputText: { not: "(historical run)" } },
    orderBy: { createdAt: "desc" },
    take: 12,
    include: { workflow: true, output: true, logs: { orderBy: { createdAt: "asc" } } },
  });

  // Pick most recent NEEDS_REVIEW or FAILED for the focal log; else first.
  const focal =
    runs.find((r) => r.status === "FAILED") ??
    runs.find((r) => r.status === "NEEDS_REVIEW") ??
    runs[0];

  return (
    <>
      <PageHeader
        title="Automation logs"
        description="Step-by-step trace of every run for debugging and audit"
        actions={
          <>
            <Button variant="outline" size="sm">
              <Download className="h-3.5 w-3.5" /> Export
            </Button>
          </>
        }
      />
      <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-12">
        <aside className="lg:col-span-4">
          <Card>
            <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
              <Search className="h-3.5 w-3.5 text-slate-400" />
              <input
                placeholder="Filter runs…"
                className="w-full bg-transparent text-sm placeholder:text-slate-400 focus:outline-none"
              />
            </div>
            <ul className="divide-y divide-slate-100">
              {runs.map((r) => (
                <li
                  key={r.id}
                  className={`flex items-start gap-3 px-4 py-3 ${r.id === focal?.id ? "bg-violet-50/40" : "hover:bg-slate-50"}`}
                >
                  <span
                    className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                      r.status === "APPROVED"
                        ? "bg-emerald-500"
                        : r.status === "NEEDS_REVIEW"
                          ? "bg-amber-500"
                          : r.status === "FAILED"
                            ? "bg-rose-500"
                            : "bg-slate-400"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {r.output?.summary?.slice(0, 60) ?? r.workflow.name}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {r.sourceType.toLowerCase()} · {formatRelativeDate(r.createdAt)}
                    </p>
                  </div>
                  <Badge tone={statusTone(r.status)}>{r.status.toLowerCase().replace("_", " ")}</Badge>
                </li>
              ))}
            </ul>
          </Card>
        </aside>

        {focal && (
          <section className="space-y-6 lg:col-span-8">
            <Card>
              <CardHeader
                title={`Run ${focal.id.slice(-8)}`}
                description={`${focal.workflow.name} · ${focal.sourceType.toLowerCase()} · ${formatRelativeDate(focal.createdAt)}`}
                action={<Badge tone={statusTone(focal.status)}>{focal.status.toLowerCase().replace("_", " ")}</Badge>}
              />
              <CardBody>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-sm">
                  <Mini label="Model" value={focal.model} />
                  <Mini label="Processing" value={`${(focal.processingMs / 1000).toFixed(1)}s`} />
                  <Mini label="Confidence" value={`${(focal.confidence * 100).toFixed(0)}%`} />
                  <Mini label="Logs" value={String(focal.logs.length)} />
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Step trace" description="Every step from input to CRM action" />
              <CardBody className="p-0">
                <ol className="divide-y divide-slate-100">
                  {focal.logs.map((l) => (
                    <li key={l.id} className="flex items-start gap-3 px-5 py-3">
                      <span className="mt-0.5 w-16 shrink-0 text-[11px] font-mono text-slate-400 tabular-nums">
                        {new Date(l.createdAt).toLocaleTimeString("en-US", { hour12: false })}
                      </span>
                      <Badge tone={LEVEL_TONE[l.level] ?? "neutral"}>{l.level.toLowerCase()}</Badge>
                      <p className="flex-1 text-sm text-slate-700">{l.message}</p>
                    </li>
                  ))}
                </ol>
              </CardBody>
            </Card>

            {focal.output && (
              <Card>
                <CardHeader title="Final output" description="Stored verbatim for audit" />
                <CardBody>
                  <pre className="overflow-x-auto rounded-lg bg-slate-950 p-4 font-mono text-[12.5px] leading-relaxed text-slate-200">
{focal.output.rawOutput}
                  </pre>
                </CardBody>
              </Card>
            )}
          </section>
        )}
      </div>
    </>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}
