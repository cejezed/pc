import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { CHART_COLORS, EUR } from "./basis-componenten";

const chartTheme = {
  grid: "#374151", // gray-700
  text: "#9ca3af", // gray-400
  tooltip: {
    backgroundColor: "#1f2937", // gray-800
    border: "1px solid #374151", // gray-700
    borderRadius: "8px",
    color: "#f3f4f6", // gray-100
  },
};

export function TimeBarChart({ data }: { data: Array<{ name: string; hours: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} vertical={false} />
        <XAxis dataKey="name" stroke={chartTheme.text} fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke={chartTheme.text} fontSize={12} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={chartTheme.tooltip}
          itemStyle={{ color: "#f3f4f6" }}
          cursor={{ fill: "rgba(255,255,255,0.05)" }}
        />
        <Bar dataKey="hours" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function BudgetPieChart({
  data,
}: {
  data: Array<{ name: string; value: number; type: string }>;
}) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={100}
          innerRadius={60}
          paddingAngle={2}
          label={(props: any) => {
            const entry = data[props.index];
            if (!entry) return '';
            return `${entry.name}`;
          }}
          labelLine={{ stroke: chartTheme.text }}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={
                entry.type === "income"
                  ? CHART_COLORS[1]
                  : CHART_COLORS[index % CHART_COLORS.length]
              }
              stroke="rgba(0,0,0,0.2)"
            />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number) => EUR(value)}
          contentStyle={chartTheme.tooltip}
          itemStyle={{ color: "#f3f4f6" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function TrendLineChart({
  data,
}: {
  data: Array<{ period: string; value: number; label?: string }>;
}) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} vertical={false} />
        <XAxis dataKey="period" stroke={chartTheme.text} fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke={chartTheme.text} fontSize={12} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={chartTheme.tooltip}
          itemStyle={{ color: "#f3f4f6" }}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke={CHART_COLORS[0]}
          strokeWidth={3}
          dot={{ fill: CHART_COLORS[0], r: 4, strokeWidth: 0 }}
          activeDot={{ r: 6, strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function ProjectPhaseChart({
  data,
}: {
  data: Array<Record<string, any>>;
}) {
  if (!data || data.length === 0) return null;

  // Extract unique phase names
  const phases = Array.from(
    new Set(
      data.flatMap((project) =>
        Object.keys(project).filter((key) => key !== "project")
      )
    )
  );

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} vertical={false} />
        <XAxis dataKey="project" stroke={chartTheme.text} fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke={chartTheme.text} fontSize={12} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={chartTheme.tooltip}
          itemStyle={{ color: "#f3f4f6" }}
          cursor={{ fill: "rgba(255,255,255,0.05)" }}
        />
        <Legend wrapperStyle={{ color: chartTheme.text }} />
        {phases.map((phase, index) => (
          <Bar
            key={phase}
            dataKey={phase}
            stackId="a"
            fill={CHART_COLORS[index % CHART_COLORS.length]}
            radius={[0, 0, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}