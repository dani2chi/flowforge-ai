import { Sparkles, Send, FileText } from "lucide-react";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRelativeDate } from "@/lib/utils";

const SAMPLE = `Hi, I run a small logistics company in Manchester and we're looking for a custom dashboard to track deliveries, driver availability, and customer updates. We currently use spreadsheets and WhatsApp. Ideally we need something built in the next 6 weeks. Budget is around $8k–$12k. Can you help?`;

export default async function IntakePage() {
  await requireSession();
  const recent = await db.automationRun.findMany({
    take: 5,
    where: { inputText: { not: "(historical run)" } },
    orderBy: { createdAt: "desc" },
    include: { output: true },
  });
  const workflows = await db.workflow.findMany({ where: { status: "ACTIVE" } });

  return (
    <>
      <PageHeader
        title="Submit an input"
        description="Manually run a message through a workflow. Use this for testing or for ad-hoc inputs."
      />
      <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="New automation run" description="Lead Intake & CRM Automation · v4 prompt" />
          <CardBody className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Workflow">
                <Select>
                  {workflows.map((w) => (
                    <option key={w.id}>{w.name}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Source">
                <Select>
                  <option>Website form</option>
                  <option>Email</option>
                  <option>Chat / WhatsApp</option>
                  <option>Support ticket</option>
                  <option>Manual entry</option>
                </Select>
              </Field>
              <Field label="From email (optional)">
                <Input placeholder="prospect@example.com" />
              </Field>
              <Field label="Tags">
                <Input placeholder="referral, retainer-fit" />
              </Field>
            </div>

            <Field label="Customer message">
              <textarea
                rows={9}
                defaultValue={SAMPLE}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-[13px] leading-relaxed text-slate-800 focus:border-slate-300 focus:outline-none"
              />
              <p className="mt-2 text-xs text-slate-500">
                Loaded with a sample prospect message. Replace with your own input or paste an email body.
              </p>
            </Field>

            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Validation: zod schema v4
                </span>
                <span>·</span>
                <span>Model: gpt-4o-mini</span>
                <span>·</span>
                <span>Confidence threshold: 0.60</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <FileText className="h-3.5 w-3.5" /> Save as draft
                </Button>
                <Button size="sm">
                  <Sparkles className="h-3.5 w-3.5" /> Process input
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="What happens next" />
            <CardBody>
              <ol className="space-y-3 text-sm">
                {[
                  "Input is cleaned and normalized",
                  "LLM extracts structured fields",
                  "Output validated against JSON schema",
                  "Lead score calculated",
                  "Reply draft generated",
                  "Routed for review or auto-approved",
                  "CRM record created",
                ].map((s, i) => (
                  <li key={s} className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-semibold text-violet-700">
                      {i + 1}
                    </span>
                    <span className="text-slate-700">{s}</span>
                  </li>
                ))}
              </ol>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Recent runs" />
            <CardBody className="p-0">
              <ul className="divide-y divide-slate-100">
                {recent.map((r) => (
                  <li key={r.id} className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <Send className="h-3.5 w-3.5 text-slate-400" />
                      <Badge tone={statusTone(r.status)}>{r.status.toLowerCase().replace("_", " ")}</Badge>
                      <span className="ml-auto text-xs text-slate-500">
                        {formatRelativeDate(r.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-xs text-slate-600">{r.output?.summary ?? r.inputText.slice(0, 160)}</p>
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

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-slate-300 focus:outline-none"
    />
  );
}
function Select({ children }: { children: React.ReactNode }) {
  return (
    <select className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-slate-300 focus:outline-none">
      {children}
    </select>
  );
}
