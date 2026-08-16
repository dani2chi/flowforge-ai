import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  delta,
  hint,
  icon,
  tone = "default",
}: {
  label: string;
  value: string | number;
  delta?: { value: string; positive?: boolean };
  hint?: string;
  icon?: React.ReactNode;
  tone?: "default" | "success" | "warning" | "danger" | "info";
}) {
  const ring: Record<string, string> = {
    default: "bg-slate-50 text-slate-600",
    success: "bg-emerald-50 text-emerald-600",
    warning: "bg-amber-50 text-amber-600",
    danger: "bg-rose-50 text-rose-600",
    info: "bg-sky-50 text-sky-600",
  };
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-900 tabular-nums">
            {value}
          </p>
          {(delta || hint) && (
            <div className="mt-2 flex items-center gap-2 text-xs">
              {delta && (
                <span
                  className={cn(
                    "font-medium",
                    delta.positive ? "text-emerald-600" : "text-rose-600",
                  )}
                >
                  {delta.positive ? "▲" : "▼"} {delta.value}
                </span>
              )}
              {hint && <span className="text-slate-500">{hint}</span>}
            </div>
          )}
        </div>
        {icon && (
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg",
              ring[tone],
            )}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
