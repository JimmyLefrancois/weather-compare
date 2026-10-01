import { useMemo, useState } from "react";
import "./App.css";
import type {
  Commune,
  ComparisonMode,
  DailyWeatherRecord,
  DateRange,
  PeriodIndicators,
} from "./types";
import { CommuneSearch } from "./components/CommuneSearch";
import { PeriodPicker } from "./components/PeriodPicker";
import { ComparisonModeSelector } from "./components/ComparisonModeSelector";
import { YearlyDeficitPicker } from "./components/YearlyDeficitPicker";
import { IndicatorsComparisonTable } from "./components/IndicatorsComparisonTable";
import { MiniComparisonChart } from "./components/MiniComparisonChart";
import { fetchDailyWeatherSeries, unpackSeries } from "./api/weather";
import {
  PERIOD_PRESETS,
  enclosingRange,
  latestAvailableDate,
  pastYearRanges,
  shiftRangeByYears,
} from "./lib/periods";
import {
  averageIndicators,
  computeIndicators,
  filterRecordsInRange,
} from "./lib/indicators";
import { analyzeYearlyHistory, type YearlyAnalysis } from "./lib/yearlyAnalysis";

interface ComparisonResult {
  indicatorsA: PeriodIndicators;
  indicatorsB: PeriodIndicators | null;
  labelA: string;
  labelB: string;
  yearlyAnalysis: YearlyAnalysis | null;
}

function defaultPeriodA(): DateRange {
  return PERIOD_PRESETS.find((p) => p.id === "3m")!.getRange();
}

function formatRangeLabel(range: DateRange): string {
  return `${range.start} → ${range.end}`;
}

export default function App() {
  const [commune, setCommune] = useState<Commune | null>(null);

  const [periodA, setPeriodA] = useState<DateRange>(defaultPeriodA());
  const [presetA, setPresetA] = useState<string | null>("3m");

  const [comparisonMode, setComparisonMode] =
    useState<ComparisonMode>("previousYear");
  const [yearsBack, setYearsBack] = useState(10);

  const [periodB, setPeriodB] = useState<DateRange>(() =>
    shiftRangeByYears(defaultPeriodA(), -1),
  );
  const [presetBOffsetApplied, setPresetBOffsetApplied] = useState(false);

  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ComparisonResult | null>(null);

  const canCompare = commune !== null && periodA.start <= periodA.end;

  function handlePresetA(presetId: string) {
    const preset = PERIOD_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setPresetA(presetId);
    const range = preset.getRange();
    setPeriodA(range);
    if (!presetBOffsetApplied) {
      setPeriodB(shiftRangeByYears(range, -1));
    }
  }

  function handlePeriodAChange(range: DateRange) {
    setPresetA(null);
    setPeriodA(range);
  }

  async function handleCompare() {
    if (!commune) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setSelectedYear(null);

    try {
      const neededRanges: DateRange[] = [periodA];
      if (comparisonMode === "custom") {
        neededRanges.push(periodB);
      } else if (comparisonMode === "previousYear") {
        neededRanges.push(shiftRangeByYears(periodA, -1));
      } else {
        neededRanges.push(...pastYearRanges(periodA, yearsBack));
      }

      const fetchRange = enclosingRange(neededRanges);
      // Never request data beyond what the archive actually has available.
      const safeEnd =
        fetchRange.end > latestAvailableDate()
          ? latestAvailableDate()
          : fetchRange.end;

      const series = await fetchDailyWeatherSeries(
        commune.latitude,
        commune.longitude,
        fetchRange.start,
        safeEnd,
      );
      const records: DailyWeatherRecord[] = unpackSeries(series);

      const indicatorsA = computeIndicators(
        filterRecordsInRange(records, periodA),
        periodA,
      );

      if (comparisonMode === "custom") {
        const indicatorsB = computeIndicators(
          filterRecordsInRange(records, periodB),
          periodB,
        );
        setResult({
          indicatorsA,
          indicatorsB,
          labelA: `Période A (${formatRangeLabel(periodA)})`,
          labelB: `Période B (${formatRangeLabel(periodB)})`,
          yearlyAnalysis: null,
        });
      } else if (comparisonMode === "previousYear") {
        const rangeB = shiftRangeByYears(periodA, -1);
        const indicatorsB = computeIndicators(
          filterRecordsInRange(records, rangeB),
          rangeB,
        );
        setResult({
          indicatorsA,
          indicatorsB,
          labelA: `Période actuelle (${formatRangeLabel(periodA)})`,
          labelB: `Année précédente (${formatRangeLabel(rangeB)})`,
          yearlyAnalysis: null,
        });
      } else if (comparisonMode === "normalAverage") {
        const analysis = analyzeYearlyHistory(records, periodA, yearsBack);
        const indicatorsB = averageIndicators(
          analysis.years.map((y) => y.indicators),
          periodA,
        );
        setResult({
          indicatorsA,
          indicatorsB,
          labelA: `Période actuelle (${formatRangeLabel(periodA)})`,
          labelB: `Normale climatique (${yearsBack} ans)`,
          yearlyAnalysis: analysis,
        });
      } else {
        // bestYear: wait for the user to pick a specific year from the chart.
        const analysis = analyzeYearlyHistory(records, periodA, yearsBack);
        setResult({
          indicatorsA,
          indicatorsB: null,
          labelA: `Période actuelle (${formatRangeLabel(periodA)})`,
          labelB: "Sélectionnez une année ci-dessous",
          yearlyAnalysis: analysis,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setLoading(false);
    }
  }

  const selectedYearSummary = useMemo(() => {
    if (!result?.yearlyAnalysis || selectedYear === null) return null;
    return result.yearlyAnalysis.years.find((y) => y.year === selectedYear) ?? null;
  }, [result, selectedYear]);

  const effectiveIndicatorsB =
    comparisonMode === "bestYear"
      ? (selectedYearSummary?.indicators ?? null)
      : (result?.indicatorsB ?? null);

  const effectiveLabelB =
    comparisonMode === "bestYear" && selectedYearSummary
      ? `Année ${selectedYearSummary.year} (${formatRangeLabel(selectedYearSummary.range)})`
      : (result?.labelB ?? "");

  return (
    <div className="app">
      <header>
        <h1>🌦️ Weather Compare</h1>
        <p>
          Consultez et comparez la pluviométrie, les températures et bien
          d'autres indicateurs météo pour votre commune.
        </p>
      </header>

      <CommuneSearch onSelect={setCommune} selected={commune} />

      <section className="panel">
        <h2>2. Période à analyser</h2>
        <PeriodPicker
          label="Période A (période actuelle)"
          range={periodA}
          onChange={handlePeriodAChange}
          activePresetId={presetA}
          onPresetSelect={handlePresetA}
        />
      </section>

      <section className="panel">
        <h2>3. Comparaison</h2>
        <ComparisonModeSelector
          mode={comparisonMode}
          onChange={setComparisonMode}
          yearsBack={yearsBack}
          onYearsBackChange={setYearsBack}
        />
        {comparisonMode === "custom" && (
          <PeriodPicker
            label="Période B (à comparer)"
            range={periodB}
            onChange={(r) => {
              setPresetBOffsetApplied(true);
              setPeriodB(r);
            }}
            activePresetId={null}
            onPresetSelect={(id) => {
              const preset = PERIOD_PRESETS.find((p) => p.id === id);
              if (preset) {
                setPresetBOffsetApplied(true);
                setPeriodB(preset.getRange());
              }
            }}
          />
        )}
      </section>

      <div className="actions">
        <button
          type="button"
          className="primary"
          disabled={!canCompare || loading}
          onClick={handleCompare}
        >
          {loading ? "Analyse en cours..." : "Comparer"}
        </button>
        {error && <p className="error">{error}</p>}
      </div>

      {result && (
        <section className="panel results">
          <h2>Résultats</h2>

          {result.yearlyAnalysis && comparisonMode === "bestYear" && (
            <YearlyDeficitPicker
              years={result.yearlyAnalysis.years}
              normalPrecipitation={result.yearlyAnalysis.normalPrecipitation}
              selectedYear={selectedYear}
              onSelect={setSelectedYear}
            />
          )}

          {effectiveIndicatorsB && (
            <>
              <IndicatorsComparisonTable
                labelA={result.labelA}
                labelB={effectiveLabelB}
                a={result.indicatorsA}
                b={effectiveIndicatorsB}
              />

              <div className="mini-charts-grid">
                <MiniComparisonChart
                  title="Précipitations"
                  unit="mm"
                  labelA="A"
                  labelB="B"
                  valueA={result.indicatorsA.precipitationTotal}
                  valueB={effectiveIndicatorsB.precipitationTotal}
                />
                <MiniComparisonChart
                  title="Température moyenne"
                  unit="°C"
                  labelA="A"
                  labelB="B"
                  valueA={result.indicatorsA.tempAvg}
                  valueB={effectiveIndicatorsB.tempAvg}
                />
                <MiniComparisonChart
                  title="Jours de pluie"
                  unit="j"
                  labelA="A"
                  labelB="B"
                  valueA={result.indicatorsA.rainyDays}
                  valueB={effectiveIndicatorsB.rainyDays}
                />
                <MiniComparisonChart
                  title="Jours de gel"
                  unit="j"
                  labelA="A"
                  labelB="B"
                  valueA={result.indicatorsA.frostDays}
                  valueB={effectiveIndicatorsB.frostDays}
                />
                <MiniComparisonChart
                  title="Ensoleillement"
                  unit="h"
                  labelA="A"
                  labelB="B"
                  valueA={result.indicatorsA.sunshineHoursTotal}
                  valueB={effectiveIndicatorsB.sunshineHoursTotal}
                />
                <MiniComparisonChart
                  title="Vent moyen"
                  unit="km/h"
                  labelA="A"
                  labelB="B"
                  valueA={result.indicatorsA.windAvg}
                  valueB={effectiveIndicatorsB.windAvg}
                />
              </div>
            </>
          )}
        </section>
      )}

      <footer>
        <p>
          Données : géocodage{" "}
          <a href="https://geo.api.gouv.fr/" target="_blank" rel="noreferrer">
            geo.api.gouv.fr
          </a>{" "}
          &middot; météo historique{" "}
          <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">
            Open-Meteo
          </a>
        </p>
      </footer>
    </div>
  );
}
