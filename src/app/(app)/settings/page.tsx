import { Key, Webhook, Cog } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function SettingsPage() {
  const session = await requireSession();
  return (
    <>
      <PageHeader title="Settings" description="Models, integrations, API keys, and review thresholds" />
      <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Model defaults" description="What runs use unless a workflow overrides" />
            <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Default model" value="gpt-4o-mini" />
              <Field label="Fallback model" value="claude-haiku-4-5" />
              <Field label="Temperature" value="0.2" />
              <Field label="Max tokens" value="2,000" />
              <Field label="Confidence threshold" value="0.60 (route below to review)" />
              <Field label="Validation mode" value="Strict (zod schema)" />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="API keys" description="Provider keys for live AI mode" />
            <CardBody className="space-y-3">
              <KeyRow label="OpenAI" masked="sk-prod-••••••••••••••••••••••••2k7r" status="active" />
              <KeyRow label="Anthropic" masked="sk-ant-••••••••••••••••••••••••8x3q" status="active" />
              <KeyRow label="Local Ollama" masked="http://ollama.internal:11434" status="paused" />
              <p className="text-xs text-slate-500">Keys are stored in the OS keychain and never exposed to the browser.</p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Outbound integrations" description="Where approved records go" />
            <CardBody className="space-y-3">
              <IntegrationRow name="HubSpot CRM" detail="Pipeline: Inbound MQL · maps to Lead object" connected />
              <IntegrationRow name="Slack #lead-pings" detail="Notifies on every high-priority lead approval" connected />
              <IntegrationRow name="Webhook (n8n)" detail="POST https://n8n.demo/webhook/leads" connected />
              <IntegrationRow name="Postgres mirror" detail="Async replication for analytics" connected={false} />
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Your profile" />
            <CardBody>
              <div className="flex items-center gap-3">
                <Avatar name={session.user.name} size="lg" />
                <div>
                  <p className="text-base font-semibold text-slate-900">{session.user.name}</p>
                  <p className="text-xs text-slate-500">{session.user.email}</p>
                  <Badge tone={session.role === "ADMIN" ? "purple" : session.role === "OPERATOR" ? "info" : "neutral"} className="mt-2">
                    {session.role}
                  </Badge>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Review queue rules" />
            <CardBody className="space-y-3 text-sm">
              <Rule label="Confidence < 0.60" value="Route to review" tone="info" />
              <Rule label="Validation issues > 2" value="Route to review" tone="warning" />
              <Rule label="Budget undefined + score < 40" value="Auto-mark as low priority" tone="neutral" />
              <Rule label="Source = chat" value="Always require human approval" tone="purple" />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="System" />
            <CardBody className="space-y-3 text-sm">
              <Toggle label="Mock AI mode (demo)" on />
              <Toggle label="Pin runs to prompt version" on />
              <Toggle label="Anonymize PII in logs" on />
              <Toggle label="Allow auto-push to CRM" on={false} />
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</label>
      <div className="mt-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800">{value}</div>
    </div>
  );
}
function KeyRow({ label, masked, status }: { label: string; masked: string; status: "active" | "paused" }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3">
      <div className="flex items-center gap-3">
        <Key className="h-4 w-4 text-slate-400" />
        <div>
          <p className="text-sm font-medium text-slate-900">{label}</p>
          <p className="font-mono text-xs text-slate-500">{masked}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge tone={status === "active" ? "success" : "neutral"}>{status}</Badge>
        <Button size="sm" variant="ghost">Rotate</Button>
      </div>
    </div>
  );
}
function IntegrationRow({ name, detail, connected }: { name: string; detail: string; connected: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3">
      <div className="flex items-center gap-3">
        <Webhook className="h-4 w-4 text-slate-400" />
        <div>
          <p className="text-sm font-medium text-slate-900">{name}</p>
          <p className="text-xs text-slate-500">{detail}</p>
        </div>
      </div>
      <Badge tone={connected ? "success" : "neutral"}>{connected ? "connected" : "not connected"}</Badge>
    </div>
  );
}
function Rule({ label, value, tone }: { label: string; value: string; tone: "info" | "warning" | "neutral" | "purple" }) {
  return (
    <div className="flex items-start gap-3">
      <Cog className="mt-0.5 h-3.5 w-3.5 text-slate-400" />
      <div className="flex-1">
        <p className="text-slate-700">{label}</p>
        <Badge tone={tone}>{value}</Badge>
      </div>
    </div>
  );
}
function Toggle({ label, on }: { label: string; on: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-700">{label}</span>
      <span
        className={`inline-block h-4 w-7 rounded-full border ${on ? "border-emerald-300 bg-emerald-100" : "border-slate-200 bg-slate-100"} relative`}
      >
        <span
          className={`absolute top-[1px] h-3 w-3 rounded-full transition-all ${on ? "left-[14px] bg-emerald-500" : "left-[1px] bg-slate-400"}`}
        />
      </span>
    </div>
  );
}
