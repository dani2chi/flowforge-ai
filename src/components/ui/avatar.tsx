import { cn } from "@/lib/utils";
import { initials } from "@/lib/utils";

const colors = [
  "bg-violet-100 text-violet-700",
  "bg-sky-100 text-sky-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-indigo-100 text-indigo-700",
  "bg-teal-100 text-teal-700",
  "bg-fuchsia-100 text-fuchsia-700",
];

function colorFor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return colors[Math.abs(h) % colors.length];
}

export function Avatar({
  name,
  size = "md",
  className,
}: {
  name: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = {
    xs: "h-6 w-6 text-[10px]",
    sm: "h-7 w-7 text-xs",
    md: "h-9 w-9 text-sm",
    lg: "h-12 w-12 text-base",
  };
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-medium ring-2 ring-white",
        sizes[size],
        colorFor(name),
        className,
      )}
      title={name}
    >
      {initials(name)}
    </div>
  );
}

export function AvatarStack({
  names,
  max = 4,
  size = "sm",
}: {
  names: string[];
  max?: number;
  size?: "xs" | "sm" | "md";
}) {
  const visible = names.slice(0, max);
  const extra = names.length - visible.length;
  return (
    <div className="flex -space-x-2">
      {visible.map((n) => (
        <Avatar key={n} name={n} size={size} />
      ))}
      {extra > 0 && (
        <div
          className={cn(
            "flex items-center justify-center rounded-full bg-slate-100 font-medium text-slate-600 ring-2 ring-white",
            size === "xs" ? "h-6 w-6 text-[10px]" : size === "sm" ? "h-7 w-7 text-xs" : "h-9 w-9 text-sm",
          )}
        >
          +{extra}
        </div>
      )}
    </div>
  );
}
