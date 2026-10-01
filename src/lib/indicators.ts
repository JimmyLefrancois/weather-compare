import type {
  DailyWeatherRecord,
  DateRange,
  DeficitStatus,
  PeriodIndicators,
} from "../types";

function sum(values: Array<number | null>): number {
  return values.reduce<number>((acc, v) => acc + (v ?? 0), 0);
}

function average(values: Array<number | null>): number | null {
  const present = values.filter((v): v is number => v !== null);
  if (!present.length) return null;
  return sum(present) / present.length;
}

export function filterRecordsInRange(
  records: DailyWeatherRecord[],
  range: DateRange,
): DailyWeatherRecord[] {
  return records.filter((r) => r.date >= range.start && r.date <= range.end);
}

const RAIN_DAY_THRESHOLD_MM = 1;
const HOT_DAY_THRESHOLD_C = 30;
const FROST_DAY_THRESHOLD_C = 0;

/** Computes aggregated weather indicators over a slice of daily records. */
export function computeIndicators(
  records: DailyWeatherRecord[],
  range: DateRange,
): PeriodIndicators {
  const precipitations = records.map((r) => r.precipitation);
  const tMaxValues = records.map((r) => r.tMax);
  const tMinValues = records.map((r) => r.tMin);
  const tMeanValues = records.map((r) => r.tMean);
  const amplitudes = records
    .filter((r) => r.tMax !== null && r.tMin !== null)
    .map((r) => (r.tMax as number) - (r.tMin as number));

  return {
    range,
    dayCount: records.length,
    precipitationTotal: round1(sum(precipitations)),
    rainyDays: records.filter(
      (r) => (r.precipitation ?? 0) >= RAIN_DAY_THRESHOLD_MM,
    ).length,
    dryDays: records.filter((r) => (r.precipitation ?? 0) < RAIN_DAY_THRESHOLD_MM)
      .length,
    maxDailyPrecipitation: round1(
      Math.max(0, ...precipitations.map((v) => v ?? 0)),
    ),
    tempAvg: roundOrNull(average(tMeanValues)),
    tempMin: tMinValues.some((v) => v !== null)
      ? round1(Math.min(...tMinValues.filter((v): v is number => v !== null)))
      : null,
    tempMax: tMaxValues.some((v) => v !== null)
      ? round1(Math.max(...tMaxValues.filter((v): v is number => v !== null)))
      : null,
    thermalAmplitudeAvg: roundOrNull(average(amplitudes)),
    frostDays: records.filter(
      (r) => r.tMin !== null && r.tMin < FROST_DAY_THRESHOLD_C,
    ).length,
    hotDays: records.filter(
      (r) => r.tMax !== null && r.tMax >= HOT_DAY_THRESHOLD_C,
    ).length,
    snowfallTotal: round1(sum(records.map((r) => r.snowfall))),
    windAvg: roundOrNull(average(records.map((r) => r.windMax))),
    windGustMax: records.some((r) => r.windGustMax !== null)
      ? round1(
          Math.max(
            ...records
              .map((r) => r.windGustMax)
              .filter((v): v is number => v !== null),
          ),
        )
      : null,
    humidityAvg: roundOrNull(average(records.map((r) => r.humidityMean))),
    sunshineHoursTotal: round1(
      sum(records.map((r) => r.sunshineSeconds)) / 3600,
    ),
  };
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function roundOrNull(value: number | null): number | null {
  return value === null ? null : round1(value);
}

/**
 * Averages a list of per-year PeriodIndicators into a single synthetic
 * "normal" indicator set (e.g. a 10-year climate normal for the same
 * month/day window). Null values (missing data for a given year) are
 * excluded from their respective averages.
 */
export function averageIndicators(
  list: PeriodIndicators[],
  range: DateRange,
): PeriodIndicators {
  const avgNum = (values: number[]): number => round1(average(values) ?? 0);
  const avgNullable = (values: Array<number | null>): number | null =>
    roundOrNull(average(values));

  return {
    range,
    dayCount: Math.round(avgNum(list.map((l) => l.dayCount))),
    precipitationTotal: avgNum(list.map((l) => l.precipitationTotal)),
    rainyDays: Math.round(avgNum(list.map((l) => l.rainyDays))),
    dryDays: Math.round(avgNum(list.map((l) => l.dryDays))),
    maxDailyPrecipitation: avgNum(list.map((l) => l.maxDailyPrecipitation)),
    tempAvg: avgNullable(list.map((l) => l.tempAvg)),
    tempMin: avgNullable(list.map((l) => l.tempMin)),
    tempMax: avgNullable(list.map((l) => l.tempMax)),
    thermalAmplitudeAvg: avgNullable(list.map((l) => l.thermalAmplitudeAvg)),
    frostDays: Math.round(avgNum(list.map((l) => l.frostDays))),
    hotDays: Math.round(avgNum(list.map((l) => l.hotDays))),
    snowfallTotal: avgNum(list.map((l) => l.snowfallTotal)),
    windAvg: avgNullable(list.map((l) => l.windAvg)),
    windGustMax: avgNullable(list.map((l) => l.windGustMax)),
    humidityAvg: avgNullable(list.map((l) => l.humidityAvg)),
    sunshineHoursTotal: avgNum(list.map((l) => l.sunshineHoursTotal)),
  };
}

/** Classifies a period's precipitation against a normal/reference value. */
export function classifyDeficit(
  precipitationTotal: number,
  normal: number,
  toleranceRatio = 0.1,
): DeficitStatus {
  if (normal <= 0) return "normal";
  const ratio = (precipitationTotal - normal) / normal;
  if (ratio <= -toleranceRatio) return "deficit";
  if (ratio >= toleranceRatio) return "surplus";
  return "normal";
}
