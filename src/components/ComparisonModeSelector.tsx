import type { ComparisonMode } from "../types";

interface ComparisonModeSelectorProps {
  mode: ComparisonMode;
  onChange: (mode: ComparisonMode) => void;
  yearsBack: number;
  onYearsBackChange: (years: number) => void;
}

const MODE_OPTIONS: { id: ComparisonMode; label: string; hint: string }[] = [
  {
    id: "previousYear",
    label: "Même période, année précédente",
    hint: "Compare aux mêmes dates il y a un an.",
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
}: ComparisonModeSelectorProps) {
  const needsYearsBack = mode === "normalAverage" || mode === "bestYear";

  return (
    <div className="comparison-mode">
      <h3>Mode de comparaison</h3>
      <div className="mode-options">
        {MODE_OPTIONS.map((opt) => (
          <label key={opt.id} className="mode-option">
            <input
              type="radio"
              name="comparison-mode"
              checked={mode === opt.id}
              onChange={() => onChange(opt.id)}
            />
            <div>
              <strong>{opt.label}</strong>
              <p>{opt.hint}</p>
            </div>
          </label>
        ))}
      </div>
      {needsYearsBack && (
        <label className="years-back">
          Nombre d'années d'historique à analyser
          <select
            value={yearsBack}
            onChange={(e) => onYearsBackChange(Number(e.target.value))}
          >
            {[5, 10, 15, 20, 30].map((n) => (
              <option key={n} value={n}>
                {n} ans
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
