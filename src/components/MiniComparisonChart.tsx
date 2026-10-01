import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";

interface MiniComparisonChartProps {
  title: string;
  unit: string;
  labelA: string;
  labelB: string;
  valueA: number | null;
  valueB: number | null;
}

export function MiniComparisonChart({
  title,
  unit,
  labelA,
  labelB,
  valueA,
  valueB,
}: MiniComparisonChartProps) {
  const theme = useTheme();
  const data = [
    { name: labelA, value: valueA ?? 0 },
    { name: labelB, value: valueB ?? 0 },
  ];

  return (
    <Paper variant="outlined" sx={{ p: 1.25 }}>
      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
        {title}
      </Typography>
      <ResponsiveContainer width="100%" height={130}>
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
          <XAxis type="number" unit={` ${unit}`} hide />
          <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 12 }} />
          <Tooltip formatter={(value) => [`${value} ${unit}`, title]} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            <Cell fill={theme.palette.primary.main} />
            <Cell fill={theme.palette.secondary.main} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  );
}
