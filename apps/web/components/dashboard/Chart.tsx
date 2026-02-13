"use client";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from "recharts";
import { salesWeekly, stockByCategory, monthlyTrend } from "@/components/dashboard/data";

function fmt(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(n >= 10_000 ? 0 : 1) + "K";
  return String(n);
}
function fmtCurrency(n: number) {
  return "₺" + n.toLocaleString("tr-TR");
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-surface p-3 shadow-glow">
      <div className="mb-2 text-sm font-semibold text-text">{label}</div>
      <div className="space-y-1">
        {payload.map((p: any, i: number) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="h-2 w-2 rounded-sm" style={{ background: p.color }} />
            <span className="text-text2">{p.name}:</span>
            <span className="font-semibold text-text">{fmtCurrency(p.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function WeeklySalesChart() {
  return (
    <div className="h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={salesWeekly}>
          <defs>
            <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="rgb(var(--primary))" stopOpacity={0.18} />
              <stop offset="95%" stopColor="rgb(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" vertical={false} />
          <XAxis dataKey="day" tick={{ fontSize: 11, fill: "rgb(var(--muted))" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "rgb(var(--muted))" }} axisLine={false} tickLine={false}
            tickFormatter={(v) => "₺" + fmt(v)} />

          <Tooltip content={<CustomTooltip />} />

          <Area type="monotone" dataKey="satis" name="Satış" stroke="rgb(var(--primary))" fill="url(#salesGrad)" strokeWidth={2.5} />
          <Area type="monotone" dataKey="iade" name="İade" stroke="rgb(var(--error))" fill="none" strokeWidth={1.5} strokeDasharray="5 5" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CategoryPieChart() {
  return (
    <div className="h-[180px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={stockByCategory} cx="50%" cy="50%" innerRadius={46} outerRadius={72} paddingAngle={3} dataKey="value" strokeWidth={0}>
            {stockByCategory.map((e, i) => <Cell key={i} fill={e.color} />)}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MonthlyBarChart() {
  return (
    <div className="h-[230px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={monthlyTrend} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" vertical={false} />
          <XAxis dataKey="ay" tick={{ fontSize: 11, fill: "rgb(var(--muted))" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "rgb(var(--muted))" }} axisLine={false} tickLine={false}
            tickFormatter={(v) => "₺" + fmt(v)} />

          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="gelir" name="Gelir" fill="rgb(var(--primary))" radius={[6, 6, 0, 0]} barSize={16} />
          <Bar dataKey="gider" name="Gider" fill="rgb(var(--accent))" radius={[6, 6, 0, 0]} barSize={16} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
