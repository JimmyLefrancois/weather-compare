import { useEffect, useState } from "react";
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
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
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
  shiftRangeToYear,
  yearOf,
} from "./lib/periods";
import {
  averageIndicators,
  computeIndicators,
  filterRecordsInRange,
} from "./lib/indicators";
import { analyzeYearlyHistory, type YearlyAnalysis } from "./lib/yearlyAnalysis";

interface ComparisonResult {
  communeName: string;
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

/** Key indicators rendered as mini charts for a pair of periods. */
function MetricCharts({
  a,
  b,
  labelA,
  labelB,
}: {
  a: PeriodIndicators;
  b: PeriodIndicators;
  labelA: string;
  labelB: string;
}) {
  const metrics: {
    title: string;
    unit: string;
    get: (p: PeriodIndicators) => number | null;
  }[] = [
    { title: "Précipitations", unit: "mm", get: (p) => p.precipitationTotal },
    { title: "Température moyenne", unit: "°C", get: (p) => p.tempAvg },
    { title: "Jours de pluie", unit: "j", get: (p) => p.rainyDays },
    { title: "Jours de gel", unit: "j", get: (p) => p.frostDays },
    { title: "Ensoleillement", unit: "h", get: (p) => p.sunshineHoursTotal },
    { title: "Vent moyen", unit: "km/h", get: (p) => p.windAvg },
  ];
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
        gap: 1.5,
      }}
    >
      {metrics.map((m) => (
        <MiniComparisonChart
          key={m.title}
          title={m.title}
          unit={m.unit}
          labelA={labelA}
          labelB={labelB}
          valueA={m.get(a)}
          valueB={m.get(b)}
        />
      ))}
    </Box>
  );
}

export default function App() {
  const [commune, setCommune] = useState<Commune | null>(null);
  const [compareOtherCommune, setCompareOtherCommune] = useState(false);
  const [communeB, setCommuneB] = useState<Commune | null>(null);

  const [periodA, setPeriodA] = useState<DateRange>(defaultPeriodA());
  const [presetA, setPresetA] = useState<string | null>("3m");

  const [comparisonMode, setComparisonMode] =
    useState<ComparisonMode>("previousYear");
  const [yearsBack, setYearsBack] = useState(10);
  const [specificYear, setSpecificYear] = useState(() => yearOf(latestAvailableDate()) - 1);

  const [periodB, setPeriodB] = useState<DateRange>(() =>
    shiftRangeByYears(defaultPeriodA(), -1),
  );
  const [presetBOffsetApplied, setPresetBOffsetApplied] = useState(false);

  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [resultB, setResultB] = useState<ComparisonResult | null>(null);

  // Selecting a target year later than periodA's own start year would shift
  // period B past the archive's available data (into the future). Cap it so
  // the dropdown never offers an inconsistent choice.
  const maxSpecificYear = yearOf(periodA.start);

  useEffect(() => {
    if (specificYear > maxSpecificYear) {
      setSpecificYear(maxSpecificYear);
    }
  }, [maxSpecificYear, specificYear]);

  const periodBValid = comparisonMode !== "custom" || periodB.start <= periodB.end;
  const canCompare =
    commune !== null &&
    (!compareOtherCommune || communeB !== null) &&
    periodA.start <= periodA.end &&
    periodBValid;

  function resetResults() {
    setResult(null);
    setResultB(null);
    setSelectedYear(null);
    setError(null);
  }

  function handleCommuneChange(c: Commune | null) {
    setCommune(c);
    resetResults();
  }

  function handleCommuneBChange(c: Commune | null) {
    setCommuneB(c);
    resetResults();
  }

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
    setResultB(null);
    setSelectedYear(null);

    try {
      const neededRanges: DateRange[] = [periodA];
      if (comparisonMode === "custom") {
        neededRanges.push(periodB);
      } else if (comparisonMode === "previousYear") {
        neededRanges.push(shiftRangeByYears(periodA, -1));
      } else if (comparisonMode === "specificYear") {
        neededRanges.push(shiftRangeToYear(periodA, specificYear));
      } else {
        neededRanges.push(...pastYearRanges(periodA, yearsBack));
      }

      const fetchRange = enclosingRange(neededRanges);
      // Never request data beyond what the archive actually has available.
      const safeEnd =
        fetchRange.end > latestAvailableDate()
          ? latestAvailableDate()
          : fetchRange.end;

      const otherCommune = compareOtherCommune ? communeB : null;
      const [series, seriesB] = await Promise.all([
        fetchDailyWeatherSeries(
          commune.latitude,
          commune.longitude,
          fetchRange.start,
          safeEnd,
        ),
        otherCommune
          ? fetchDailyWeatherSeries(
              otherCommune.latitude,
              otherCommune.longitude,
              fetchRange.start,
              safeEnd,
            )
          : Promise.resolve(null),
      ]);
      setResult(buildResult(unpackSeries(series), commune.nom));
      if (seriesB && otherCommune) {
        setResultB(buildResult(unpackSeries(seriesB), otherCommune.nom));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setLoading(false);
    }
  }

  // Same filters applied to one locality's daily records.
  function buildResult(
    records: DailyWeatherRecord[],
    communeName: string,
  ): ComparisonResult {
    const indicatorsA = computeIndicators(
      filterRecordsInRange(records, periodA),
      periodA,
    );
    const labelA = `Période actuelle (${formatRangeLabel(periodA)})`;
    const indicatorsOver = (range: DateRange) =>
      computeIndicators(filterRecordsInRange(records, range), range);

    if (comparisonMode === "custom") {
      return {
        communeName,
        indicatorsA,
        indicatorsB: indicatorsOver(periodB),
        labelA: `Période A (${formatRangeLabel(periodA)})`,
        labelB: `Période B (${formatRangeLabel(periodB)})`,
        yearlyAnalysis: null,
      };
    }
    if (comparisonMode === "previousYear") {
      const rangeB = shiftRangeByYears(periodA, -1);
      return {
        communeName,
        indicatorsA,
        indicatorsB: indicatorsOver(rangeB),
        labelA,
        labelB: `Année précédente (${formatRangeLabel(rangeB)})`,
        yearlyAnalysis: null,
      };
    }
    if (comparisonMode === "specificYear") {
      const rangeB = shiftRangeToYear(periodA, specificYear);
      return {
        communeName,
        indicatorsA,
        indicatorsB: indicatorsOver(rangeB),
        labelA,
        labelB: `Année ${specificYear} (${formatRangeLabel(rangeB)})`,
        yearlyAnalysis: null,
      };
    }
    const analysis = analyzeYearlyHistory(records, periodA, yearsBack);
    if (comparisonMode === "normalAverage") {
      return {
        communeName,
        indicatorsA,
        indicatorsB: averageIndicators(
          analysis.years.map((y) => y.indicators),
          periodA,
        ),
        labelA,
        labelB: `Normale climatique (${yearsBack} ans)`,
        yearlyAnalysis: analysis,
      };
    }
    // bestYear: the user picks the year from the chart.
    return {
      communeName,
      indicatorsA,
      indicatorsB: null,
      labelA,
      labelB: "Sélectionnez une année ci-dessous",
      yearlyAnalysis: analysis,
    };
  }

  function resolveSide(res: ComparisonResult | null) {
    if (!res) return null;
    if (comparisonMode !== "bestYear") {
      return res.indicatorsB
        ? { indicatorsB: res.indicatorsB, labelB: res.labelB }
        : null;
    }
    const summary = res.yearlyAnalysis?.years.find((y) => y.year === selectedYear);
    return summary
      ? {
          indicatorsB: summary.indicators,
          labelB: `Année ${summary.year} (${formatRangeLabel(summary.range)})`,
        }
      : null;
  }

  const sideX = resolveSide(result);
  const sideY = resolveSide(resultB);

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
            <Stack spacing={2}>
              <CommuneSearch onSelect={handleCommuneChange} selected={commune} />
              <FormControlLabel
                control={
                  <Switch
                    checked={compareOtherCommune}
                    onChange={(e) => {
                      setCompareOtherCommune(e.target.checked);
                      resetResults();
                      if (!e.target.checked) setCommuneB(null);
                    }}
                  />
                }
                label="Comparer avec une autre localité"
              />
              {compareOtherCommune && (
                <>
                  <Divider />
                  <Typography variant="subtitle2">Localité de comparaison</Typography>
                  <CommuneSearch onSelect={handleCommuneBChange} selected={communeB} />
                </>
              )}
            </Stack>
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
                specificYear={specificYear}
                onSpecificYearChange={setSpecificYear}
                maxSpecificYear={maxSpecificYear}
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
                  {!periodBValid && (
                    <Alert severity="warning">
                      La date de fin de la période B doit être postérieure ou égale à sa date de début.
                    </Alert>
                  )}
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

          {result && sideX && (
            <StepCard step={4} icon={<InsightsIcon fontSize="small" />} title="Résultats">
              <Stack spacing={3}>
                {[
                  { res: result, side: sideX },
                  ...(resultB && sideY ? [{ res: resultB, side: sideY }] : []),
                ].map(({ res, side }) => (
                  <Stack key={res.communeName} spacing={2}>
                    {resultB && (
                      <Typography variant="h6" component="h2">
                        {res.communeName}
                      </Typography>
                    )}
                    <IndicatorsComparisonList
                      labelA={res.labelA}
                      labelB={side.labelB}
                      a={res.indicatorsA}
                      b={side.indicatorsB}
                    />
                    <MetricCharts
                      a={res.indicatorsA}
                      b={side.indicatorsB}
                      labelA="A"
                      labelB="B"
                    />
                    <Divider />
                  </Stack>
                ))}

                {resultB && (
                  <Stack spacing={2}>
                    <Typography variant="h6" component="h2">
                      {result.communeName} vs {resultB.communeName}
                    </Typography>
                    <IndicatorsComparisonList
                      labelA={`${result.communeName} · ${result.labelA}`}
                      labelB={`${resultB.communeName} · ${resultB.labelA}`}
                      a={result.indicatorsA}
                      b={resultB.indicatorsA}
                    />
                    <MetricCharts
                      a={result.indicatorsA}
                      b={resultB.indicatorsA}
                      labelA={result.communeName}
                      labelB={resultB.communeName}
                    />
                  </Stack>
                )}
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
