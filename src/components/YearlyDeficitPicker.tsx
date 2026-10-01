import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import type { ChipProps } from "@mui/material/Chip";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { useTheme } from "@mui/material/styles";
import type { YearlyPeriodSummary } from "../types";

interface YearlyDeficitPickerProps {
  years: YearlyPeriodSummary[];
  normalPrecipitation: number;
  selectedYear: number | null;
  onSelect: (year: number) => void;
}

const STATUS_CHIP_COLOR: Record<string, ChipProps["color"]> = {
  deficit: "error",
  normal: "info",
  surplus: "success",
};

export function YearlyDeficitPicker({
  years,
  normalPrecipitation,
  selectedYear,
  onSelect,
}: YearlyDeficitPickerProps) {
  const theme = useTheme();
  const statusColor: Record<string, string> = {
    deficit: theme.palette.error.main,
    normal: theme.palette.info.main,
    surplus: theme.palette.success.main,
  };

  const chartData = [...years]
    .sort((a, b) => a.year - b.year)
    .map((y) => ({
      year: y.year,
      precipitation: y.indicators.precipitationTotal,
      status: y.deficitStatus ?? "normal",
    }));

  return (
    <Stack spacing={1.5}>
      <Typography variant="body2" color="text.secondary">
        Normale calculée sur {years.length} ans pour cette même période (mois/
        jours) : <strong>{normalPrecipitation} mm</strong>. Sélectionnez une
        année sans déficit pour la comparaison.
      </Typography>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" tick={{ fontSize: 11 }} />
          <YAxis unit=" mm" tick={{ fontSize: 11 }} />
          <Tooltip formatter={(value) => [`${value} mm`, "Précipitations"]} />
          <ReferenceLine
            y={normalPrecipitation}
            stroke={theme.palette.text.secondary}
            strokeDasharray="4 4"
            label={{ value: "Normale", position: "insideTopRight", fontSize: 11 }}
          />
          <Bar
            dataKey="precipitation"
            onClick={(data) => {
              const payload = (data as { payload?: { year: number } }).payload;
              if (payload) onSelect(payload.year);
            }}
            cursor="pointer"
            radius={[4, 4, 0, 0]}
          >
            {chartData.map((entry) => (
              <Cell
                key={entry.year}
                fill={statusColor[entry.status]}
                stroke={selectedYear === entry.year ? theme.palette.text.primary : undefined}
                strokeWidth={selectedYear === entry.year ? 2 : 0}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <Stack
        direction="row"
        spacing={1}
        useFlexGap
        sx={{ flexWrap: "wrap", rowGap: 1 }}
      >
        {chartData.map((entry) => (
          <Chip
            key={entry.year}
            label={`${entry.year} · ${entry.precipitation} mm`}
            color={STATUS_CHIP_COLOR[entry.status]}
            variant={selectedYear === entry.year ? "filled" : "outlined"}
            icon={
              entry.status === "deficit" ? (
                <WarningAmberIcon />
              ) : entry.status === "surplus" ? (
                <WaterDropIcon />
              ) : undefined
            }
            onClick={() => onSelect(entry.year)}
            clickable
          />
        ))}
      </Stack>
    </Stack>
  );
}
