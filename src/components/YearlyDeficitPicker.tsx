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
import type { YearlyPeriodSummary } from "../types";

interface YearlyDeficitPickerProps {
  years: YearlyPeriodSummary[];
  normalPrecipitation: number;
  selectedYear: number | null;
  onSelect: (year: number) => void;
}

const STATUS_COLORS: Record<string, string> = {
  deficit: "#d9534f",
  normal: "#5bc0de",
  surplus: "#5cb85c",
};

export function YearlyDeficitPicker({
  years,
  normalPrecipitation,
  selectedYear,
  onSelect,
}: YearlyDeficitPickerProps) {
  const chartData = [...years]
    .sort((a, b) => a.year - b.year)
    .map((y) => ({
      year: y.year,
      precipitation: y.indicators.precipitationTotal,
      status: y.deficitStatus ?? "normal",
    }));

  return (
    <div className="yearly-picker">
      <p className="hint">
        Normale calculée sur {years.length} ans pour cette même période (mois/
        jours) : <strong>{normalPrecipitation} mm</strong>. Sélectionnez une
        année sans déficit pour la comparaison.
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" />
          <YAxis unit=" mm" />
          <Tooltip
            formatter={(value) => [`${value} mm`, "Précipitations"]}
          />
          <ReferenceLine
            y={normalPrecipitation}
            stroke="#888"
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
          >
            {chartData.map((entry) => (
              <Cell
                key={entry.year}
                fill={STATUS_COLORS[entry.status]}
                stroke={selectedYear === entry.year ? "#222" : undefined}
                strokeWidth={selectedYear === entry.year ? 2 : 0}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="year-buttons">
        {chartData.map((entry) => (
          <button
            key={entry.year}
            type="button"
            className={
              (selectedYear === entry.year ? "selected " : "") + entry.status
            }
            onClick={() => onSelect(entry.year)}
          >
            {entry.year} &middot; {entry.precipitation} mm
            {entry.status === "deficit" && " ⚠️"}
            {entry.status === "surplus" && " 💧"}
          </button>
        ))}
      </div>
    </div>
  );
}
