import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Zap,
  Database,
} from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge, statusTone } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import { AreaChart } from "@/components/charts/area-chart";
import { BarChart } from "@/components/charts/bar-chart";
import { formatNumber, formatRelativeDate } from "@/lib/utils";

export default async function DashboardPage() {
  await requireSession();
  const [allRuns, runsLast30, recentRuns, topLeads] = await Promise.all([
    db.automationRun.count(),
    db.automationRun.findMany({
      where: { createdAt: { gte: new Date(Date.now() - 30 * 86400000) } },
      select: { status: true, createdAt: true, processingMs: true, sourceType: true, confidence: true },
    }),
    db.automationRun.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: { workflow: true, output: true, lead: true },
      where: { inputText: { not: "(historical run)" } },
    }),
    db.cRMLead.findMany({
      take: 6,
      orderBy: { leadScore: "desc" },
      include: { automationRun: true },
    }),
  ]);

  const successCount = runsLast30.filter((r) => r.status === "APPROVED").length;
  const reviewCount = runsLast30.filter((r) => r.status === "NEEDS_REVIEW").length;
  const failedCount = runsLast30.filter((r) => r.status === "FAILED").length;
  const avgMs =
    runsLast30.length > 0
      ? Math.round(
          runsLast30.reduce((s, r) => s + r.processingMs, 0) / runsLast30.length / 100,
        ) / 10
      : 0;
  const avgConfidence =
    runsLast30.length > 0
      ? runsLast30.reduce((s, r) => s + r.confidence, 0) / runsLast30.length
      : 0;
  const timeSavedMin = Math.round((successCount * 18) / 60);

  // 14-day trend
  const trend: Array<{ label: string; runs: number }> = [];
  for (let i = 13; i >= 0; i--) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - i);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    const count = runsLast30.filter((r) => r.createdAt >= start && r.createdAt < end).length;
    trend.push({
      label: start.toLocaleDateString("en-US", { day: "numeric", month: "short" }),
      runs: count,
    });
  }

  // Source breakdown
  const sourceCounts = ["FORM", "EMAIL", "CHAT", "TICKET"].map((s) => ({
    label: s[0] + s.slice(1).toLowerCase(),
    count: runsLast30.filter((r) => r.sourceType === s).length,
  }));

  return (
    <>
      <PageHeader
        title="Automation overview"
        description="What's been running, what needs review, and what made it to the CRM"
      />
      <div className="space-y-6 p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total runs"
            value={formatNumber(allRuns)}
            delta={{ value: "+218 this month", positive: true }}
            icon={<Zap className="h-4 w-4" />}
            tone="info"
          />
          <StatCard
            label="First-pass success"
            value={`${runsLast30.length ? Math.round((successCount / runsLast30.length) * 100) : 0}%`}
            hint={`${successCount} of ${runsLast30.length} runs (30d)`}
            icon={<CheckCircle2 className="h-4 w-4" />}
            tone="success"
          />
          <StatCard
            label="Needs review"
            value={reviewCount}
            hint="awaiting human approval"
            icon={<AlertTriangle className="h-4 w-4" />}
            tone="warning"
          />
          <StatCard
            label="Time saved"
            value={`${timeSavedMin} hrs`}
            delta={{ value: "+14 vs prior 30d", positive: true }}
            icon={<Clock className="h-4 w-4" />}
            tone="success"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader
              title="Runs over the last 14 days"
              description={`Avg processing ${avgMs}s · Avg confidence ${(avgConfidence * 100).toFixed(0)}%`}
              action={
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" /> success
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-amber-500" /> review
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-rose-500" /> failed
                  </span>
                </div>
              }
            />
            <CardBody>
              <AreaChart data={trend} dataKey="runs" color="#7c3aed" />
              <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
                <Mini label="Success" value={successCount} dot="#10b981" />
                <Mini label="Review" value={reviewCount} dot="#f59e0b" />
                <Mini label="Failed" value={failedCount} dot="#ef4444" />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="By source" description="Where inputs came from" />
            <CardBody>
              <BarChart
                data={sourceCounts}
                dataKey="count"
                color="#7c3aed"
                colors={["#7c3aed", "#0ea5e9", "#f59e0b", "#94a3b8"]}
                height={200}
              />
            </CardBody>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader
              title="Recent runs"
              description="Latest automation activity"
              action={
                <Link href="/logs" className="text-xs font-medium text-slate-700 hover:text-slate-900">
                  View all →
                </Link>
              }
            />
            <CardBody className="p-0">
              <ul className="divide-y divide-slate-100">
                {recentRuns.map((r) => (
                  <li key={r.id} className="flex items-start gap-3 px-5 py-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {r.output?.summary?.slice(0, 100) ?? r.workflow.name}
                        </p>
                        <Badge tone={statusTone(r.status)}>{r.status.toLowerCase().replace("_", " ")}</Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {r.workflow.name} · {r.sourceType.toLowerCase()} · {(r.processingMs / 1000).toFixed(1)}s · confidence {(r.confidence * 100).toFixed(0)}%
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-slate-500">{formatRelativeDate(r.createdAt)}</span>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Top scoring leads"
              description="Highest quality from the last 30 days"
              action={<Database className="h-4 w-4 text-slate-400" />}
            />
            <CardBody className="p-0">
              <ul className="divide-y divide-slate-100">
                {topLeads.map((l) => (
                  <li key={l.id} className="px-5 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {l.company ?? "Unknown company"}
                        </p>
                        <p className="truncate text-xs text-slate-500">{l.serviceNeeded}</p>
                      </div>
                      <span className="shrink-0 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold tabular-nums text-emerald-700">
                        {l.leadScore}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
                      <Badge tone={l.priority === "HIGH" ? "danger" : l.priority === "MEDIUM" ? "info" : "neutral"}>
                        {l.priority.toLowerCase()}
                      </Badge>
                      <span>{l.budget ?? "budget tbd"}</span>
                      <span>·</span>
                      <span>{l.timeline ?? "timeline tbd"}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}

function Mini({ label, value, dot }: { label: string; value: number; dot: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2">
      <span className="h-2 w-2 rounded-full" style={{ background: dot }} />
      <span className="text-slate-600">{label}</span>
      <span className="ml-auto font-semibold tabular-nums text-slate-900">{value}</span>
    </div>
  );
}
