import { Plus, Sparkles, Beaker, History } from "lucide-react";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function PromptsPage() {
  await requireSession();
  const prompts = await db.promptTemplate.findMany({ orderBy: [{ status: "asc" }, { name: "asc" }] });
  const focal = prompts.find((p) => p.name === "Lead extraction") ?? prompts[0];
  const schema = JSON.parse(focal.outputSchema);

  return (
    <>
      <PageHeader
        title="Prompts"
        description="Versioned prompt templates with output schemas, models, and rollout status"
        actions={
          <>
            <Button variant="outline" size="sm">
              <Beaker className="h-3.5 w-3.5" /> Test prompt
            </Button>
            <Button size="sm">
              <Plus className="h-3.5 w-3.5" /> New prompt
            </Button>
          </>
        }
      />
      <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-12">
        <aside className="lg:col-span-4 space-y-3">
          {prompts.map((p) => (
            <Card key={p.id} className={p.id === focal.id ? "ring-2 ring-violet-200" : ""}>
              <CardBody className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{p.name}</p>
                    <p className="truncate text-xs text-slate-500">{p.purpose}</p>
                  </div>
                  <Badge tone={statusTone(p.status)}>{p.status.toLowerCase()}</Badge>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                  <Sparkles className="h-3 w-3" />
                  <span>{p.model}</span>
                  <span>·</span>
                  <span>temp {p.temperature.toFixed(1)}</span>
                  <span className="ml-auto inline-flex items-center gap-1">
                    <History className="h-3 w-3" /> v{p.version}
                  </span>
                </div>
              </CardBody>
            </Card>
          ))}
        </aside>

        <section className="space-y-6 lg:col-span-8">
          <Card>
            <CardHeader
              title={focal.name}
              description={focal.purpose}
              action={
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Badge tone="purple">v{focal.version}</Badge>
                  <Badge tone={statusTone(focal.status)}>{focal.status.toLowerCase()}</Badge>
                  <span>·</span>
                  <span>{focal.model} · temp {focal.temperature.toFixed(1)}</span>
                </div>
              }
            />
            <CardBody className="space-y-5">
              <PromptSection title="System prompt" body={focal.systemPrompt} />
              <PromptSection title="User prompt template" body={focal.userPrompt} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Expected output schema"
              description="Strict JSON. Validation is enforced with zod before write."
            />
            <CardBody>
              <pre className="overflow-x-auto rounded-lg bg-slate-950 p-4 font-mono text-[12.5px] leading-relaxed text-slate-200">
{JSON.stringify(schema, null, 2)}
              </pre>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Version history" description="Every change is versioned and pinned to runs" />
            <CardBody className="p-0">
              <ul className="divide-y divide-slate-100">
                {[
                  { v: 4, when: "12 days ago", who: "Avery Lin", note: "Tightened JSON schema; pain_points now required array." },
                  { v: 3, when: "1 month ago", who: "Avery Lin", note: "Added confidence field; lowered temperature to 0.2." },
                  { v: 2, when: "2 months ago", who: "Avery Lin", note: "Asked model to use null instead of empty strings." },
                  { v: 1, when: "3 months ago", who: "Avery Lin", note: "Initial extraction prompt." },
                ].map((h) => (
                  <li key={h.v} className="flex items-start gap-3 px-5 py-3.5">
                    <Badge tone="purple">v{h.v}</Badge>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-slate-800">{h.note}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{h.who} · {h.when}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        </section>
      </div>
    </>
  );
}

function PromptSection({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <pre className="mt-2 whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-[13px] leading-relaxed text-slate-800">
{body}
      </pre>
    </div>
  );
}
