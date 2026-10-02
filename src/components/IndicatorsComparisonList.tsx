import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import type { PeriodIndicators } from "../types";

interface IndicatorsComparisonListProps {
  labelA: string;
  labelB: string;
  a: PeriodIndicators;
  b: PeriodIndicators;
}

interface Row {
  label: string;
  unit: string;
  getValue: (p: PeriodIndicators) => number | null;
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

/** A small horizontal twin-bar visualization comparing two magnitudes. */
function ComparisonBars({
  valueA,
  valueB,
}: {
  valueA: number | null;
  valueB: number | null;
}) {
  const magnitude = Math.max(Math.abs(valueA ?? 0), Math.abs(valueB ?? 0), 1e-6);
  const widthA = valueA === null ? 0 : (Math.abs(valueA) / magnitude) * 100;
  const widthB = valueB === null ? 0 : (Math.abs(valueB) / magnitude) * 100;

  return (
    <Stack spacing={0.5} sx={{ mt: 0.75 }}>
      <Box sx={{ height: 6, borderRadius: 3, bgcolor: "action.hover", position: "relative" }}>
        <Box
          sx={{
            height: "100%",
            width: `${widthA}%`,
            borderRadius: 3,
            bgcolor: "primary.main",
          }}
        />
      </Box>
      <Box sx={{ height: 6, borderRadius: 3, bgcolor: "action.hover", position: "relative" }}>
        <Box
          sx={{
            height: "100%",
            width: `${widthB}%`,
            borderRadius: 3,
            bgcolor: "secondary.main",
          }}
        />
      </Box>
    </Stack>
  );
}

export function IndicatorsComparisonList({
  labelA,
  labelB,
  a,
  b,
}: IndicatorsComparisonListProps) {
  return (
    <Stack spacing={1.5}>
      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap", rowGap: 1 }}>
        <Chip size="small" label={labelA} sx={{ bgcolor: "primary.main", color: "primary.contrastText", height: "auto", maxWidth: "100%", "& .MuiChip-label": { whiteSpace: "normal", py: 0.5 } }} />
        <Chip size="small" label={labelB} sx={{ bgcolor: "secondary.main", color: "secondary.contrastText", height: "auto", maxWidth: "100%", "& .MuiChip-label": { whiteSpace: "normal", py: 0.5 } }} />
      </Stack>

      <Grid container spacing={1.25}>
        {ROWS.map((row) => {
          const vA = row.getValue(a);
          const vB = row.getValue(b);
          const hasBoth = vA !== null && vB !== null;
          const delta = hasBoth ? Math.round((vA - vB) * 10) / 10 : null;
          const trend = delta === null || delta === 0 ? null : delta > 0 ? "up" : "down";

          return (
            <Grid key={row.label} size={{ xs: 12, sm: 6 }}>
              <Paper variant="outlined" sx={{ p: 1.25 }}>
                <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, pr: 1 }}>
                    {row.label}
                  </Typography>
                  {trend && (
                    <Chip
                      size="small"
                      icon={trend === "up" ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />}
                      label={`${delta! > 0 ? "+" : ""}${delta} ${row.unit}`}
                      color={trend === "up" ? "success" : "error"}
                      variant="outlined"
                      sx={{ height: 22, "& .MuiChip-icon": { fontSize: 14 } }}
                    />
                  )}
                </Stack>
                <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
                  <Typography variant="h6" color="primary.main">
                    {formatValue(vA, row.unit)}
                  </Typography>
                  <Typography variant="h6" color="secondary.main">
                    {formatValue(vB, row.unit)}
                  </Typography>
                </Stack>
                <ComparisonBars valueA={vA} valueB={vB} />
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      <Typography variant="caption" color="text.secondary">
        Jours couverts : {a.dayCount} ({labelA}) · {b.dayCount} ({labelB})
      </Typography>
    </Stack>
  );
}
