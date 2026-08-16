import { cn } from "@/lib/utils";

export function Progress({
  value,
  className,
  tone = "default",
}: {
  value: number;
  className?: string;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  const v = Math.max(0, Math.min(100, value));
  const colors = {
    default: "bg-slate-900",
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    danger: "bg-rose-500",
  };
  return (
    <div
      className={cn(
        "h-1.5 w-full overflow-hidden rounded-full bg-slate-100",
        className,
      )}
    >
      <div
        className={cn("h-full rounded-full transition-all", colors[tone])}
        style={{ width: `${v}%` }}
      />
    </div>
  );
}
