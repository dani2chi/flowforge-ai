import { cn } from "@/lib/utils";

type Tone =
  | "default"
  | "neutral"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "purple"
  | "amber";

const tones: Record<Tone, string> = {
  default: "bg-slate-100 text-slate-700 ring-slate-200",
  neutral: "bg-slate-100 text-slate-700 ring-slate-200",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  warning: "bg-amber-50 text-amber-800 ring-amber-200",
  danger: "bg-rose-50 text-rose-700 ring-rose-200",
  info: "bg-sky-50 text-sky-700 ring-sky-200",
  purple: "bg-violet-50 text-violet-700 ring-violet-200",
  amber: "bg-orange-50 text-orange-700 ring-orange-200",
};

export function Badge({
  children,
  tone = "default",
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function statusTone(status: string): Tone {
  const s = status.toUpperCase();
  if (["DONE", "COMPLETED", "SUCCESS", "ACTIVE", "APPROVED", "VALID"].includes(s)) return "success";
  if (["IN_PROGRESS", "RUNNING", "REVIEW", "QUALIFIED", "CONTACTED"].includes(s)) return "info";
  if (["TODO", "PLANNING", "BACKLOG", "PENDING", "QUEUED", "NEW"].includes(s)) return "neutral";
  if (["BLOCKED", "FAILED", "REJECTED", "OVERDUE", "URGENT", "INVALID", "LOST"].includes(s)) return "danger";
  if (["WARNING", "NEEDS_REVIEW", "PAUSED", "HIGH"].includes(s)) return "warning";
  if (["ARCHIVED", "DISABLED"].includes(s)) return "neutral";
  if (["MEDIUM"].includes(s)) return "info";
  if (["LOW"].includes(s)) return "neutral";
  return "default";
}

export function priorityTone(priority: string): Tone {
  const p = priority.toUpperCase();
  if (p === "URGENT") return "danger";
  if (p === "HIGH") return "warning";
  if (p === "MEDIUM") return "info";
  return "neutral";
}
