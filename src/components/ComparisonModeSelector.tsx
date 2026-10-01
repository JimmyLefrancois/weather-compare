import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Paper from "@mui/material/Paper";
import Radio from "@mui/material/Radio";
import Typography from "@mui/material/Typography";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import type { ComparisonMode } from "../types";
import { ARCHIVE_START_YEAR } from "../lib/periods";

interface ComparisonModeSelectorProps {
  mode: ComparisonMode;
  onChange: (mode: ComparisonMode) => void;
  yearsBack: number;
  onYearsBackChange: (years: number) => void;
  specificYear: number;
  onSpecificYearChange: (year: number) => void;
  /** Latest year selectable without pushing period B past the available archive data. */
  maxSpecificYear: number;
}

const MODE_OPTIONS: { id: ComparisonMode; label: string; hint: string }[] = [
  {
    id: "previousYear",
    label: "Même période, année précédente",
    hint: "Compare aux mêmes dates il y a un an.",
  },
  {
    id: "specificYear",
    label: "Une année précise",
    hint: "Choisissez librement n'importe quelle année passée.",
  },
  {
    id: "custom",
    label: "Période personnalisée",
    hint: "Choisissez librement une autre plage de dates.",
  },
  {
    id: "normalAverage",
    label: "Normale climatique (moyenne N ans)",
    hint: "Compare à la moyenne des N dernières années pour les mêmes dates.",
  },
  {
    id: "bestYear",
    label: "Année sans déficit de pluie",
    hint: "Choisissez une année passée où cette période n'a pas connu de déficit de pluie.",
  },
];

export function ComparisonModeSelector({
  mode,
  onChange,
  yearsBack,
  onYearsBackChange,
  specificYear,
  onSpecificYearChange,
  maxSpecificYear,
}: ComparisonModeSelectorProps) {
  const needsYearsBack = mode === "normalAverage" || mode === "bestYear";
  const needsSpecificYear = mode === "specificYear";

  const years: number[] = [];
  for (let y = maxSpecificYear; y >= ARCHIVE_START_YEAR; y--) {
    years.push(y);
  }

  return (
    <Stack spacing={1.5}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          gap: 1.25,
        }}
      >
        {MODE_OPTIONS.map((opt) => (
          <Paper
            key={opt.id}
            variant="outlined"
            onClick={() => onChange(opt.id)}
            sx={{
              display: "flex",
              alignItems: "flex-start",
              gap: 1,
              p: 1.25,
              cursor: "pointer",
              borderColor: mode === opt.id ? "primary.main" : "divider",
              borderWidth: mode === opt.id ? 2 : 1,
              bgcolor: mode === opt.id ? "action.selected" : "transparent",
            }}
          >
            <Radio
              checked={mode === opt.id}
              value={opt.id}
              size="small"
              sx={{ p: 0, mt: 0.25 }}
            />
            <Stack spacing={0.25}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {opt.label}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {opt.hint}
              </Typography>
            </Stack>
          </Paper>
        ))}
      </Box>

      {needsYearsBack && (
        <FormControl size="small" sx={{ maxWidth: 220 }}>
          <InputLabel id="years-back-label">Historique analysé</InputLabel>
          <Select
            labelId="years-back-label"
            label="Historique analysé"
            value={yearsBack}
            onChange={(e) => onYearsBackChange(Number(e.target.value))}
          >
            {[5, 10, 15, 20, 30].map((n) => (
              <MenuItem key={n} value={n}>
                {n} ans
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {needsSpecificYear && (
        <FormControl size="small" sx={{ maxWidth: 220 }}>
          <InputLabel id="specific-year-label">Année à comparer</InputLabel>
          <Select
            labelId="specific-year-label"
            label="Année à comparer"
            value={specificYear}
            onChange={(e) => onSpecificYearChange(Number(e.target.value))}
            MenuProps={{ slotProps: { paper: { sx: { maxHeight: 320 } } } }}
          >
            {years.map((y) => (
              <MenuItem key={y} value={y}>
                {y}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
    </Stack>
  );
}
