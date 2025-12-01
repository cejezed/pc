// components/analytics/finance-charts.tsx

import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";

export function RevenueChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data}>
        <XAxis dataKey="year" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} />
        <Line type="monotone" dataKey="net_profit" stroke="#3b82f6" strokeWidth={3} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function CostStructureChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}>
        <XAxis dataKey="year" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="office" fill="#6366f1" />
        <Bar dataKey="vehicle" fill="#f59e0b" />
        <Bar dataKey="sales" fill="#10b981" />
        <Bar dataKey="general" fill="#ef4444" />
      </BarChart>
    </ResponsiveContainer>
  );
}
