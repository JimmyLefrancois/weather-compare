import type { DailyWeatherRecord, DateRange, YearlyPeriodSummary } from "../types";
import { classifyDeficit, computeIndicators, filterRecordsInRange } from "./indicators";
import { pastYearRanges } from "./periods";

export interface YearlyAnalysis {
  /** The reference ("normal") precipitation total, averaged over all available years. */
  normalPrecipitation: number;
  years: YearlyPeriodSummary[];
}

/**
 * Computes, for the same month/day window as `referenceRange`, the weather
 * indicators of each of the `yearsBack` preceding years. This is used both to
 * compute a multi-year "climate normal" and to let the user pick a specific
 * past year that had no rainfall deficit.
 */
export function analyzeYearlyHistory(
  records: DailyWeatherRecord[],
  referenceRange: DateRange,
  yearsBack: number,
): YearlyAnalysis {
  const ranges = pastYearRanges(referenceRange, yearsBack);

  const rawYears = ranges.map((range) => {
    const yearRecords = filterRecordsInRange(records, range);
    const indicators = computeIndicators(yearRecords, range);
    return { range, indicators };
  });

  // Only keep years where we actually received a near-complete data set;
  // older years may be partially missing depending on the station's history.
  const expectedDays = rawYears[0]
    ? rawYears[0].indicators.dayCount
    : 0;
  const usableYears = rawYears.filter(
    (y) => y.indicators.dayCount >= expectedDays * 0.9,
  );

  const normalPrecipitation = usableYears.length
    ? usableYears.reduce((acc, y) => acc + y.indicators.precipitationTotal, 0) /
      usableYears.length
    : 0;

  const years: YearlyPeriodSummary[] = rawYears.map(({ range, indicators }) => ({
    year: Number(range.start.slice(0, 4)),
    range,
    indicators,
    precipitationDeltaVsNormal: usableYears.length
      ? Math.round((indicators.precipitationTotal - normalPrecipitation) * 10) / 10
      : null,
    deficitStatus: usableYears.length
      ? classifyDeficit(indicators.precipitationTotal, normalPrecipitation)
      : null,
  }));

  return { normalPrecipitation: Math.round(normalPrecipitation * 10) / 10, years };
}
