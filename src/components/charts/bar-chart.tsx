"use client";

import {
  Bar,
  BarChart as RBarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function BarChart({
  data,
  dataKey,
  xKey = "label",
  height = 240,
  color = "#0f172a",
  colors,
}: {
  data: Array<Record<string, number | string>>;
  dataKey: string;
  xKey?: string;
  height?: number;
  color?: string;
  colors?: string[];
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RBarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey={xKey} stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
        <Tooltip
          cursor={{ fill: "#f1f5f9" }}
          contentStyle={{
            background: "white",
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Bar dataKey={dataKey} radius={[6, 6, 0, 0]} fill={color}>
          {colors &&
            data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
        </Bar>
      </RBarChart>
    </ResponsiveContainer>
  );
}
