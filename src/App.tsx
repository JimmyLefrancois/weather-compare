import { useMemo, useState } from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import CircularProgress from "@mui/material/CircularProgress";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import PlaceIcon from "@mui/icons-material/Place";
import DateRangeIcon from "@mui/icons-material/DateRange";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import InsightsIcon from "@mui/icons-material/Insights";

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
import { IndicatorsComparisonList } from "./components/IndicatorsComparisonList";
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

/** A numbered section card used for each step of the mobile-first workflow. */
function StepCard({
  step,
  icon,
  title,
  children,
}: {
  step: number;
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card variant="outlined">
      <CardHeader
        avatar={
          <Avatar sx={{ bgcolor: "primary.main", width: 32, height: 32 }}>
            {icon}
          </Avatar>
        }
        title={
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {step}. {title}
          </Typography>
        }
        sx={{ pb: 0 }}
      />
      <CardContent>{children}</CardContent>
    </Card>
  );
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
    <Box sx={{ minHeight: "100%", display: "flex", flexDirection: "column" }}>
      <AppBar position="sticky" color="primary" elevation={0}>
        <Toolbar>
          <WbSunnyIcon sx={{ mr: 1.5 }} />
          <Typography variant="h1" component="div" sx={{ flexGrow: 1 }}>
            Weather Compare
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ flexGrow: 1, py: 2, pb: 10 }}>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Consultez et comparez la pluviométrie, les températures et bien
            d'autres indicateurs météo pour votre commune.
          </Typography>

          <StepCard step={1} icon={<PlaceIcon fontSize="small" />} title="Localisation">
            <CommuneSearch onSelect={setCommune} selected={commune} />
          </StepCard>

          <StepCard step={2} icon={<DateRangeIcon fontSize="small" />} title="Période à analyser">
            <PeriodPicker
              label="Période actuelle"
              range={periodA}
              onChange={handlePeriodAChange}
              activePresetId={presetA}
              onPresetSelect={handlePresetA}
            />
          </StepCard>

          <StepCard step={3} icon={<CompareArrowsIcon fontSize="small" />} title="Comparaison">
            <Stack spacing={2}>
              <ComparisonModeSelector
                mode={comparisonMode}
                onChange={setComparisonMode}
                yearsBack={yearsBack}
                onYearsBackChange={setYearsBack}
              />
              {comparisonMode === "custom" && (
                <>
                  <Divider />
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
                </>
              )}
              {comparisonMode === "bestYear" && result?.yearlyAnalysis && (
                <>
                  <Divider />
                  <YearlyDeficitPicker
                    years={result.yearlyAnalysis.years}
                    normalPrecipitation={result.yearlyAnalysis.normalPrecipitation}
                    selectedYear={selectedYear}
                    onSelect={setSelectedYear}
                  />
                </>
              )}
            </Stack>
          </StepCard>

          {error && <Alert severity="error">{error}</Alert>}

          {result && effectiveIndicatorsB && (
            <StepCard step={4} icon={<InsightsIcon fontSize="small" />} title="Résultats">
              <Stack spacing={2}>
                <IndicatorsComparisonList
                  labelA={result.labelA}
                  labelB={effectiveLabelB}
                  a={result.indicatorsA}
                  b={effectiveIndicatorsB}
                />

                <Divider />
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      sm: "1fr 1fr",
                    },
                    gap: 1.5,
                  }}
                >
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
                </Box>
              </Stack>
            </StepCard>
          )}

          <Typography variant="caption" color="text.secondary" sx={{ textAlign: "center" }}>
            Données : géocodage{" "}
            <a href="https://geo.api.gouv.fr/" target="_blank" rel="noreferrer">
              geo.api.gouv.fr
            </a>{" "}
            · météo historique{" "}
            <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">
              Open-Meteo
            </a>
          </Typography>
        </Stack>
      </Container>

      {/* Sticky bottom action bar keeps the primary CTA in the mobile thumb zone. */}
      <Paper
        elevation={8}
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          p: 1.5,
          borderRadius: 0,
          zIndex: (theme) => theme.zIndex.appBar,
        }}
      >
        <Container maxWidth="md" disableGutters sx={{ px: 1.5 }}>
          <Button
            fullWidth
            size="large"
            variant="contained"
            disabled={!canCompare || loading}
            onClick={handleCompare}
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <CompareArrowsIcon />}
          >
            {loading ? "Analyse en cours..." : "Comparer"}
          </Button>
        </Container>
      </Paper>
    </Box>
  );
}
