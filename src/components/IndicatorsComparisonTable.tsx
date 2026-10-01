import type { PeriodIndicators } from "../types";

interface IndicatorsComparisonTableProps {
  labelA: string;
  labelB: string;
  a: PeriodIndicators;
  b: PeriodIndicators;
}

interface Row {
  label: string;
  unit: string;
  getValue: (p: PeriodIndicators) => number | null;
  /** If true, a higher value for A relative to B is highlighted as "better" (e.g. more sunshine). Informational only. */
  precision?: number;
}

const ROWS: Row[] = [
  { label: "Précipitations cumulées", unit: "mm", getValue: (p) => p.precipitationTotal },
  { label: "Jours de pluie (≥1mm)", unit: "j", getValue: (p) => p.rainyDays },
  { label: "Jours secs", unit: "j", getValue: (p) => p.dryDays },
  { label: "Pluie max en 1 jour", unit: "mm", getValue: (p) => p.maxDailyPrecipitation },
  { label: "Température moyenne", unit: "°C", getValue: (p) => p.tempAvg },
  { label: "Température minimale", unit: "°C", getValue: (p) => p.tempMin },
  { label: "Température maximale", unit: "°C", getValue: (p) => p.tempMax },
  { label: "Amplitude thermique moy.", unit: "°C", getValue: (p) => p.thermalAmplitudeAvg },
  { label: "Jours de gel (Tmin<0°C)", unit: "j", getValue: (p) => p.frostDays },
  { label: "Jours de forte chaleur (Tmax≥30°C)", unit: "j", getValue: (p) => p.hotDays },
  { label: "Cumul de neige", unit: "cm", getValue: (p) => p.snowfallTotal },
  { label: "Vent moyen (rafale journ. max)", unit: "km/h", getValue: (p) => p.windAvg },
  { label: "Rafale de vent max", unit: "km/h", getValue: (p) => p.windGustMax },
  { label: "Humidité moyenne", unit: "%", getValue: (p) => p.humidityAvg },
  { label: "Ensoleillement cumulé", unit: "h", getValue: (p) => p.sunshineHoursTotal },
];

function formatValue(value: number | null, unit: string): string {
  if (value === null) return "—";
  return `${value} ${unit}`;
}

function formatDelta(a: number | null, b: number | null, unit: string): string {
  if (a === null || b === null) return "";
  const delta = Math.round((a - b) * 10) / 10;
  if (delta === 0) return "=";
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta} ${unit}`;
}

export function IndicatorsComparisonTable({
  labelA,
  labelB,
  a,
  b,
}: IndicatorsComparisonTableProps) {
  return (
    <table className="comparison-table">
      <thead>
        <tr>
          <th>Indicateur</th>
          <th>{labelA}</th>
          <th>{labelB}</th>
          <th>Écart</th>
        </tr>
      </thead>
      <tbody>
        {ROWS.map((row) => {
          const vA = row.getValue(a);
          const vB = row.getValue(b);
          const delta = formatDelta(vA, vB, row.unit);
          const deltaClass =
            vA !== null && vB !== null
              ? vA > vB
                ? "delta-up"
                : vA < vB
                  ? "delta-down"
                  : "delta-flat"
              : undefined;
          return (
            <tr key={row.label}>
              <td>{row.label}</td>
              <td>{formatValue(vA, row.unit)}</td>
              <td>{formatValue(vB, row.unit)}</td>
              <td className={deltaClass}>{delta}</td>
            </tr>
          );
        })}
        <tr className="meta-row">
          <td>Nombre de jours couverts</td>
          <td>{a.dayCount}</td>
          <td>{b.dayCount}</td>
          <td></td>
        </tr>
      </tbody>
    </table>
  );
}
