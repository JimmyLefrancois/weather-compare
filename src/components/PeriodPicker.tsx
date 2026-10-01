import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import type { DateRange } from "../types";
import {
  PERIOD_PRESETS,
  isoToLocalDate,
  latestAvailableDate,
  localDateToISO,
} from "../lib/periods";

interface PeriodPickerProps {
  label: string;
  range: DateRange;
  onChange: (range: DateRange) => void;
  activePresetId: string | null;
  onPresetSelect: (presetId: string) => void;
  maxDate?: string;
}

export function PeriodPicker({
  label,
  range,
  onChange,
  activePresetId,
  onPresetSelect,
  maxDate,
}: PeriodPickerProps) {
  const max = maxDate ?? latestAvailableDate();

  return (
    <Stack spacing={1.5}>
      <Typography variant="subtitle2" color="text.secondary">
        {label}
      </Typography>
      <Stack
        direction="row"
        spacing={1}
        sx={{
          overflowX: "auto",
          pb: 0.5,
          "&::-webkit-scrollbar": { height: 4 },
        }}
      >
        {PERIOD_PRESETS.map((preset) => (
          <Chip
            key={preset.id}
            label={preset.label}
            clickable
            color={activePresetId === preset.id ? "primary" : "default"}
            variant={activePresetId === preset.id ? "filled" : "outlined"}
            onClick={() => onPresetSelect(preset.id)}
            sx={{ flexShrink: 0 }}
          />
        ))}
      </Stack>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
        <DatePicker
          label="Du"
          value={isoToLocalDate(range.start)}
          maxDate={isoToLocalDate(range.end)}
          onChange={(newValue) => {
            if (newValue) onChange({ ...range, start: localDateToISO(newValue) });
          }}
          format="dd/MM/yyyy"
          slotProps={{ textField: { size: "small", fullWidth: true } }}
        />
        <DatePicker
          label="Au"
          value={isoToLocalDate(range.end)}
          minDate={isoToLocalDate(range.start)}
          maxDate={isoToLocalDate(max)}
          onChange={(newValue) => {
            if (newValue) onChange({ ...range, end: localDateToISO(newValue) });
          }}
          format="dd/MM/yyyy"
          slotProps={{ textField: { size: "small", fullWidth: true } }}
        />
      </Stack>
    </Stack>
  );
}
