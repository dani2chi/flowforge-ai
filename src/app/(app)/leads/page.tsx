import { Plus, Search, Download } from "lucide-react";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Table, THead, TR, TH, TBody, TD } from "@/components/ui/table";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRelativeDate } from "@/lib/utils";

export default async function LeadsPage() {
  await requireSession();
  const leads = await db.cRMLead.findMany({
    orderBy: { createdAt: "desc" },
    include: { automationRun: { include: { output: true } } },
  });

  const stats = {
    total: leads.length,
    high: leads.filter((l) => l.priority === "HIGH").length,
    qualified: leads.filter((l) => ["QUALIFIED", "CONTACTED", "DISCOVERY"].includes(l.status)).length,
    avgScore: leads.length ? Math.round(leads.reduce((s, l) => s + l.leadScore, 0) / leads.length) : 0,
  };

  return (
    <>
      <PageHeader
        title="CRM leads"
        description="Records created automatically from approved automation runs"
        actions={
          <>
            <Button variant="outline" size="sm">
              <Download className="h-3.5 w-3.5" /> Export
            </Button>
            <Button size="sm">
              <Plus className="h-3.5 w-3.5" /> Add lead
            </Button>
          </>
        }
      />
      <div className="space-y-4 p-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Pill label="All leads" value={stats.total} />
          <Pill label="High priority" value={stats.high} dot="#ef4444" />
          <Pill label="Qualified+" value={stats.qualified} dot="#10b981" />
          <Pill label="Avg score" value={stats.avgScore} dot="#7c3aed" />
        </div>

        <Card>
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-5 py-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                placeholder="Search leads…"
                className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-slate-300 focus:outline-none"
              />
            </div>
            <Chip label="Status: All" />
            <Chip label="Priority: Any" />
            <Chip label="Source: Any" />
            <Chip label="Sort: Recent" />
          </div>
          <Table>
            <THead>
              <TR>
                <TH>Lead</TH>
                <TH>Service needed</TH>
                <TH>Budget</TH>
                <TH>Timeline</TH>
                <TH>Priority</TH>
                <TH className="text-right">Score</TH>
                <TH>Status</TH>
                <TH>Source</TH>
                <TH>Created</TH>
              </TR>
            </THead>
            <TBody>
              {leads.map((l) => (
                <TR key={l.id}>
                  <TD>
                    <p className="font-medium text-slate-900">{l.company ?? "Unknown company"}</p>
                    <p className="text-xs text-slate-500">{l.name ?? l.email ?? "no contact"}</p>
                  </TD>
                  <TD className="max-w-[280px]">
                    <p className="truncate text-sm text-slate-700">{l.serviceNeeded}</p>
                    {l.industry && <p className="text-xs text-slate-500">{l.industry}</p>}
                  </TD>
                  <TD className="text-sm text-slate-700">{l.budget ?? <span className="text-slate-400">—</span>}</TD>
                  <TD className="text-sm text-slate-700">{l.timeline ?? <span className="text-slate-400">—</span>}</TD>
                  <TD>
                    <Badge tone={l.priority === "HIGH" ? "danger" : l.priority === "MEDIUM" ? "info" : "neutral"}>
                      {l.priority.toLowerCase()}
                    </Badge>
                  </TD>
                  <TD className="text-right tabular-nums">
                    <span
                      className={`inline-flex h-6 min-w-[36px] items-center justify-center rounded-md px-2 text-xs font-semibold ${
                        l.leadScore >= 75
                          ? "bg-emerald-100 text-emerald-700"
                          : l.leadScore >= 50
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {l.leadScore}
                    </span>
                  </TD>
                  <TD>
                    <Badge tone={statusTone(l.status)}>{l.status.toLowerCase()}</Badge>
                  </TD>
                  <TD className="text-xs text-slate-500">{l.source.toLowerCase()}</TD>
                  <TD className="text-xs text-slate-500">{formatRelativeDate(l.createdAt)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      </div>
    </>
  );
}

function Pill({ label, value, dot = "#94a3b8" }: { label: string; value: number; dot?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
      <span className="h-2 w-2 rounded-full" style={{ background: dot }} />
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        <p className="text-lg font-semibold tabular-nums text-slate-900">{value}</p>
      </div>
    </div>
  );
}
function Chip({ label }: { label: string }) {
  return (
    <button className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:border-slate-300">
      {label}
    </button>
  );
}
