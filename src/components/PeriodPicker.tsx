import type { DateRange } from "../types";
import { PERIOD_PRESETS, latestAvailableDate } from "../lib/periods";

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
    <div className="period-picker">
      <h3>{label}</h3>
      <div className="preset-buttons">
        {PERIOD_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className={activePresetId === preset.id ? "selected" : undefined}
            onClick={() => onPresetSelect(preset.id)}
          >
            {preset.label}
          </button>
        ))}
      </div>
      <div className="date-inputs">
        <label>
          Du
          <input
            type="date"
            value={range.start}
            max={range.end}
            onChange={(e) => onChange({ ...range, start: e.target.value })}
          />
        </label>
        <label>
          Au
          <input
            type="date"
            value={range.end}
            min={range.start}
            max={max}
            onChange={(e) => onChange({ ...range, end: e.target.value })}
          />
        </label>
      </div>
    </div>
  );
}
