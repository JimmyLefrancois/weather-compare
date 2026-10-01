import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface MiniComparisonChartProps {
  title: string;
  unit: string;
  labelA: string;
  labelB: string;
  valueA: number | null;
  valueB: number | null;
}

const COLOR_A = "#3b82f6";
const COLOR_B = "#f97316";

export function MiniComparisonChart({
  title,
  unit,
  labelA,
  labelB,
  valueA,
  valueB,
}: MiniComparisonChartProps) {
  const data = [
    { name: labelA, value: valueA ?? 0 },
    { name: labelB, value: valueB ?? 0 },
  ];

  return (
    <div className="mini-chart">
      <h4>{title}</h4>
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
          <XAxis type="number" unit={` ${unit}`} hide />
          <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 12 }} />
          <Tooltip formatter={(value) => [`${value} ${unit}`, title]} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            <Cell fill={COLOR_A} />
            <Cell fill={COLOR_B} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
