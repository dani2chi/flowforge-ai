import { Download } from "lucide-react";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { AreaChart } from "@/components/charts/area-chart";
import { BarChart } from "@/components/charts/bar-chart";
import { DonutChart } from "@/components/charts/donut-chart";
import { formatNumber } from "@/lib/utils";

export default async function AnalyticsPage() {
  await requireSession();

  const runs = await db.automationRun.findMany({
    select: { status: true, processingMs: true, confidence: true, createdAt: true, model: true, sourceType: true },
  });
  const leads = await db.cRMLead.findMany({ select: { leadScore: true, priority: true, status: true } });

  const successCount = runs.filter((r) => r.status === "APPROVED").length;
  const reviewCount = runs.filter((r) => r.status === "NEEDS_REVIEW").length;
  const failedCount = runs.filter((r) => r.status === "FAILED").length;

  const trend = Array.from({ length: 12 }, (_, i) => ({
    label: new Date(2025, 4 + i, 1).toLocaleString("en-US", { month: "short" }),
    runs: 60 + ((i * 11) % 40) + (i > 6 ? 30 : 0),
  }));

  const scoreBuckets = [
    { label: "0–25", count: leads.filter((l) => l.leadScore < 25).length },
    { label: "25–50", count: leads.filter((l) => l.leadScore >= 25 && l.leadScore < 50).length },
    { label: "50–75", count: leads.filter((l) => l.leadScore >= 50 && l.leadScore < 75).length },
    { label: "75+", count: leads.filter((l) => l.leadScore >= 75).length },
  ];

  const modelMix = ["gpt-4o-mini", "gpt-4o", "claude-haiku-4-5"].map((m) => ({
    name: m,
    value: runs.filter((r) => r.model === m).length,
  }));

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Throughput, quality, and cost across the workflow"
        actions={
          <Button size="sm">
            <Download className="h-3.5 w-3.5" /> Export PDF
          </Button>
        }
      />
      <div className="space-y-6 p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total runs" value={formatNumber(runs.length)} delta={{ value: "+218", positive: true }} />
          <StatCard label="Success rate" value={`${runs.length ? Math.round((successCount / runs.length) * 100) : 0}%`} hint={`${successCount} approved`} />
          <StatCard label="Review rate" value={`${runs.length ? ((reviewCount / runs.length) * 100).toFixed(1) : 0}%`} hint={`${reviewCount} runs`} tone="warning" />
          <StatCard label="Failure rate" value={`${runs.length ? ((failedCount / runs.length) * 100).toFixed(1) : 0}%`} hint={`${failedCount} runs`} tone="danger" />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader title="Runs over time" description="Last 12 months · all workflows" />
            <CardBody>
              <AreaChart data={trend} dataKey="runs" color="#7c3aed" height={280} />
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Model mix" description="Where requests went" />
            <CardBody>
              <DonutChart data={modelMix} colors={["#7c3aed", "#0ea5e9", "#10b981"]} />
              <ul className="mt-3 space-y-1.5 text-xs">
                {modelMix.map((m, i) => (
                  <li key={m.name} className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-slate-600">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: ["#7c3aed", "#0ea5e9", "#10b981"][i] }}
                      />
                      {m.name}
                    </span>
                    <span className="tabular-nums text-slate-900">{m.value}</span>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader title="Lead score distribution" />
            <CardBody>
              <BarChart data={scoreBuckets} dataKey="count" colors={["#94a3b8", "#cbd5e1", "#0ea5e9", "#10b981"]} />
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Performance" />
            <CardBody className="grid grid-cols-2 gap-4 text-sm">
              <Stat label="Avg processing time" value={`${(runs.reduce((s, r) => s + r.processingMs, 0) / Math.max(runs.length, 1) / 1000).toFixed(1)}s`} />
              <Stat label="Avg confidence" value={`${((runs.reduce((s, r) => s + r.confidence, 0) / Math.max(runs.length, 1)) * 100).toFixed(0)}%`} />
              <Stat label="Avg lead score" value={String(leads.length ? Math.round(leads.reduce((s, l) => s + l.leadScore, 0) / leads.length) : 0)} />
              <Stat label="Time saved (est.)" value={`${Math.round((successCount * 18) / 60)} hrs`} />
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-slate-900 tabular-nums">{value}</p>
    </div>
  );
}
