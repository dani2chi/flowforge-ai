import {
  Inbox,
  Wand2,
  Sparkles,
  ShieldCheck,
  Gauge,
  MessageSquare,
  ClipboardCheck,
  Database,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const STEP_ICONS: Record<string, React.ReactNode> = {
  INPUT: <Inbox className="h-4 w-4" />,
  PREPROCESS: <Wand2 className="h-4 w-4" />,
  AI_PROMPT: <Sparkles className="h-4 w-4" />,
  VALIDATE: <ShieldCheck className="h-4 w-4" />,
  SCORE: <Gauge className="h-4 w-4" />,
  HUMAN_REVIEW: <ClipboardCheck className="h-4 w-4" />,
  API_ACTION: <Database className="h-4 w-4" />,
  EXPORT: <CheckCircle2 className="h-4 w-4" />,
};

const STEP_TINT: Record<string, string> = {
  INPUT: "bg-slate-50 text-slate-700 border-slate-200",
  PREPROCESS: "bg-sky-50 text-sky-800 border-sky-200",
  AI_PROMPT: "bg-violet-50 text-violet-800 border-violet-200",
  VALIDATE: "bg-emerald-50 text-emerald-800 border-emerald-200",
  SCORE: "bg-amber-50 text-amber-800 border-amber-200",
  HUMAN_REVIEW: "bg-fuchsia-50 text-fuchsia-800 border-fuchsia-200",
  API_ACTION: "bg-indigo-50 text-indigo-800 border-indigo-200",
  EXPORT: "bg-emerald-50 text-emerald-800 border-emerald-200",
};

export default async function WorkflowsPage() {
  await requireSession();
  const workflows = await db.workflow.findMany({
    include: {
      steps: { orderBy: { order: "asc" } },
      _count: { select: { runs: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <>
      <PageHeader
        title="Workflows"
        description="Visual pipeline of how unstructured inputs become structured CRM records"
        actions={<Button size="sm">+ New workflow</Button>}
      />
      <div className="space-y-6 p-6">
        {workflows.map((w) => (
          <Card key={w.id}>
            <CardHeader
              title={w.name}
              description={w.description ?? undefined}
              action={
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">{w._count.runs} runs</span>
                  <Badge tone={statusTone(w.status)}>{w.status.toLowerCase()}</Badge>
                </div>
              }
            />
            <CardBody>
              <div className="overflow-x-auto">
                <ol className="flex min-w-fit items-stretch gap-2">
                  {w.steps.map((s, i) => (
                    <li key={s.id} className="flex items-stretch gap-2">
                      <div
                        className={`flex w-56 shrink-0 flex-col rounded-xl border p-3 ${STEP_TINT[s.type] ?? STEP_TINT.INPUT}`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/80 ring-1 ring-current/20">
                            {STEP_ICONS[s.type] ?? <Sparkles className="h-4 w-4" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-semibold uppercase tracking-wide opacity-70">
                              Step {i + 1} · {s.type.replace("_", " ").toLowerCase()}
                            </p>
                            <p className="truncate text-sm font-semibold">{s.name}</p>
                          </div>
                        </div>
                        <p className="mt-2 text-xs leading-relaxed opacity-80">{s.description}</p>
                      </div>
                      {i < w.steps.length - 1 && (
                        <div className="flex items-center justify-center text-slate-400">
                          <ArrowRight className="h-4 w-4" />
                        </div>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            </CardBody>
          </Card>
        ))}

        <Card>
          <CardHeader title="What this workflow does, end to end" />
          <CardBody className="space-y-3 text-sm leading-relaxed text-slate-700">
            <p>
              Inbound prospect messages from forms, email, chat, or tickets enter the pipeline. We
              clean and normalize the text, run an LLM extraction prompt to pull out structured fields,
              and validate the output against a strict JSON schema with{" "}
              <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono">zod</code>.
            </p>
            <p>
              A rule-based scorer assigns lead quality from 0–100 based on budget fit, timeline
              urgency, service fit, and intent. A second prompt drafts a personalized reply matching
              tone of voice. Anything below the configured confidence threshold or with validation
              issues is routed to a human review queue.
            </p>
            <p>
              Once approved (or edited), the run pushes a structured record into the CRM, logs the
              activity, and emits a webhook. Every step is fully logged, so debugging a single run is
              one click away.
            </p>
            <div className="grid gap-3 pt-2 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold text-slate-700">Why human-in-the-loop?</p>
                <p className="mt-1 text-xs text-slate-600">
                  Production AI workflows that affect customer data must let a human approve or edit
                  before write. Confidence + validation status feed directly into routing.
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold text-slate-700">Why prompt versioning?</p>
                <p className="mt-1 text-xs text-slate-600">
                  Every prompt change is versioned. Runs are pinned to the prompt version they used,
                  so we can compare quality before and after a prompt edit.
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
