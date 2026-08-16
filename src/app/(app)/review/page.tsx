import {
  CheckCircle2,
  XCircle,
  Pencil,
  Send,
  Sparkles,
  AlertTriangle,
  Database,
  Copy,
} from "lucide-react";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRelativeDate } from "@/lib/utils";

export default async function ReviewQueuePage() {
  await requireSession();
  const runs = await db.automationRun.findMany({
    where: { status: { in: ["NEEDS_REVIEW", "APPROVED"] }, output: { isNot: null } },
    orderBy: [{ status: "desc" }, { createdAt: "desc" }],
    take: 12,
    include: { output: true, workflow: true, lead: true },
  });

  // Pick the focal run: first NEEDS_REVIEW, else most recent.
  const focal = runs.find((r) => r.status === "NEEDS_REVIEW") ?? runs[0];
  const queueRest = runs.filter((r) => r.id !== focal?.id);

  if (!focal) {
    return (
      <>
        <PageHeader title="Review queue" />
        <div className="p-10 text-center text-sm text-slate-500">No runs to review.</div>
      </>
    );
  }

  const parsed = JSON.parse(focal.output!.rawOutput);
  const issues: string[] = focal.output!.validationIssues
    ? JSON.parse(focal.output!.validationIssues)
    : [];

  return (
    <>
      <PageHeader
        title="Review queue"
        description={`${runs.filter((r) => r.status === "NEEDS_REVIEW").length} runs awaiting review · ${runs.length - runs.filter((r) => r.status === "NEEDS_REVIEW").length} approved this hour`}
      />
      <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-12">
        <aside className="lg:col-span-3">
          <Card>
            <CardHeader title="Queue" description={`${runs.length} runs`} />
            <CardBody className="p-0">
              <ul className="divide-y divide-slate-100">
                <QueueItem run={focal} active />
                {queueRest.slice(0, 8).map((r) => (
                  <QueueItem key={r.id} run={r} />
                ))}
              </ul>
            </CardBody>
          </Card>
        </aside>

        <section className="space-y-6 lg:col-span-9">
          <Card>
            <CardHeader
              title={focal.output!.summary}
              description={`${focal.workflow.name} · ${focal.sourceType.toLowerCase()} source · ${formatRelativeDate(focal.createdAt)}`}
              action={
                <div className="flex items-center gap-2">
                  <Badge tone={statusTone(focal.status)}>{focal.status.toLowerCase().replace("_", " ")}</Badge>
                  <Badge tone={focal.confidence >= 0.8 ? "success" : focal.confidence >= 0.6 ? "warning" : "danger"}>
                    confidence {(focal.confidence * 100).toFixed(0)}%
                  </Badge>
                </div>
              }
            />
            <CardBody>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Original input
                  </h4>
                  <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-[12.5px] leading-relaxed text-slate-700 whitespace-pre-wrap">
                    {focal.inputText}
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                    <span>Source: {focal.sourceType.toLowerCase()}</span>
                    <span>·</span>
                    <span>Model: {focal.model}</span>
                    <span>·</span>
                    <span>{(focal.processingMs / 1000).toFixed(1)}s</span>
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Extracted fields
                  </h4>
                  <dl className="mt-2 space-y-2 rounded-lg border border-slate-200 bg-white p-3 text-sm">
                    {[
                      ["Contact name", parsed.contact_name],
                      ["Company", parsed.company],
                      ["Industry", parsed.industry],
                      ["Service needed", parsed.service_needed],
                      ["Budget", parsed.budget],
                      ["Timeline", parsed.timeline],
                      ["Priority", parsed.priority],
                      ["Lead score", parsed.lead_score],
                    ].map(([k, v]) => (
                      <div key={k as string} className="flex items-start justify-between gap-3 border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                        <dt className="text-xs font-medium text-slate-500">{k as string}</dt>
                        <dd className="max-w-[60%] text-right text-sm font-medium text-slate-900">
                          {v == null || v === "" ? <span className="text-slate-400">—</span> : String(v)}
                        </dd>
                      </div>
                    ))}
                    <div>
                      <dt className="text-xs font-medium text-slate-500">Pain points</dt>
                      <dd className="mt-1 flex flex-wrap gap-1.5">
                        {(parsed.pain_points ?? []).map((p: string) => (
                          <Badge key={p} tone="info">{p}</Badge>
                        ))}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </CardBody>
          </Card>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader title="AI summary & recommended action" />
              <CardBody className="space-y-3 text-sm">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Summary</p>
                  <p className="mt-1 leading-relaxed text-slate-700">{focal.output!.summary}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recommended action</p>
                  <p className="mt-1 leading-relaxed text-slate-700">{focal.output!.recommendedAction}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-semibold text-slate-700">Validation</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <Badge tone={focal.output!.validationStatus === "VALID" ? "success" : "warning"}>
                      {focal.output!.validationStatus.toLowerCase()}
                    </Badge>
                    <span className="text-xs text-slate-500">{issues.length} issue{issues.length === 1 ? "" : "s"}</span>
                  </div>
                  {issues.length > 0 && (
                    <ul className="mt-2 space-y-1 text-xs text-slate-600">
                      {issues.map((i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <AlertTriangle className="mt-0.5 h-3 w-3 text-amber-500" />
                          {i}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader
                title="Reply draft"
                description="Edit before sending"
                action={
                  <Button variant="ghost" size="sm">
                    <Copy className="h-3.5 w-3.5" /> Copy
                  </Button>
                }
              />
              <CardBody>
                <textarea
                  rows={9}
                  defaultValue={focal.output!.replyDraft}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-[13px] leading-relaxed text-slate-800 focus:border-slate-300 focus:outline-none"
                />
                <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                  <span>{focal.output!.replyDraft.length} chars · ~{Math.ceil(focal.output!.replyDraft.split(" ").length)} words</span>
                  <span className="inline-flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3" /> Reply prompt v6
                  </span>
                </div>
              </CardBody>
            </Card>
          </div>

          <Card>
            <CardHeader title="Raw JSON output" description="Exactly what the model returned (after parse)" />
            <CardBody>
              <pre className="overflow-x-auto rounded-lg bg-slate-950 p-4 font-mono text-[12.5px] leading-relaxed text-slate-200">
{JSON.stringify(parsed, null, 2)}
              </pre>
            </CardBody>
          </Card>

          <div className="sticky bottom-0 -mx-6 border-t border-slate-200 bg-white/95 px-6 py-4 backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-slate-500">
                Reviewer: <strong className="text-slate-900">Mateo Salazar (Operator)</strong> · 11 reviews today
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Pencil className="h-3.5 w-3.5" /> Edit & approve
                </Button>
                <Button variant="outline" size="sm">
                  <XCircle className="h-3.5 w-3.5" /> Reject
                </Button>
                <Button size="sm">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                </Button>
                <Button variant="default" size="sm" className="bg-violet-600 hover:bg-violet-500">
                  <Database className="h-3.5 w-3.5" /> Push to CRM
                </Button>
                <Button variant="ghost" size="sm">
                  <Send className="h-3.5 w-3.5" /> Send reply
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

function QueueItem({
  run,
  active = false,
}: {
  run: { id: string; status: string; confidence: number; sourceType: string; createdAt: Date; output: { summary: string } | null };
  active?: boolean;
}) {
  return (
    <li className={`flex items-start gap-3 px-4 py-3 ${active ? "bg-violet-50/40" : "hover:bg-slate-50"}`}>
      <span
        className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
          run.status === "NEEDS_REVIEW" ? "bg-amber-500" : "bg-emerald-500"
        }`}
      />
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm ${active ? "font-semibold text-violet-900" : "font-medium text-slate-800"}`}>
          {run.output?.summary?.slice(0, 60) ?? "(no summary)"}
        </p>
        <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-500">
          <span>{run.sourceType.toLowerCase()}</span>
          <span>·</span>
          <span>{(run.confidence * 100).toFixed(0)}%</span>
          <span>·</span>
          <span>{formatRelativeDate(run.createdAt)}</span>
        </div>
      </div>
    </li>
  );
}
