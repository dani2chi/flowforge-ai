"use client";

import {
  Cell,
  Pie,
  PieChart as RPieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

export function DonutChart({
  data,
  height = 220,
  colors = ["#0f172a", "#475569", "#94a3b8", "#cbd5e1", "#e2e8f0"],
}: {
  data: Array<{ name: string; value: number }>;
  height?: number;
  colors?: string[];
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={height}>
        <RPieChart>
          <Pie
            data={data}
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
            stroke="none"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "white",
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
        </RPieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-2xl font-semibold text-slate-900 tabular-nums">{total}</p>
        <p className="text-xs text-slate-500">total</p>
      </div>
    </div>
  );
}
