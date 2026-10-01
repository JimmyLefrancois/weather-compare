import type { DateRange } from "../types";

/** Parses an ISO yyyy-MM-dd string into a UTC-anchored Date (avoids local-timezone drift). */
export function parseISODate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function formatISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  const date = parseISODate(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return formatISODate(date);
}

export function addMonths(iso: string, months: number): string {
  const date = parseISODate(iso);
  date.setUTCMonth(date.getUTCMonth() + months);
  return formatISODate(date);
}

export function addYears(iso: string, years: number): string {
  const date = parseISODate(iso);
  date.setUTCFullYear(date.getUTCFullYear() + years);
  return formatISODate(date);
}

export function daysBetween(start: string, end: string): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round(
    (parseISODate(end).getTime() - parseISODate(start).getTime()) / msPerDay,
  );
}

/** The archive API lags a few days behind real time; keep a safety margin. */
export const ARCHIVE_LAG_DAYS = 5;

/** Open-Meteo's historical archive reliably starts around 1940. */
export const ARCHIVE_START_YEAR = 1940;

/**
 * Converts an ISO yyyy-MM-dd string into a local (non-UTC) Date object,
 * suitable for MUI date pickers which operate on local calendar dates.
 */
export function isoToLocalDate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** Converts a local (non-UTC) Date back into an ISO yyyy-MM-dd string. */
export function localDateToISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function today(): string {
  return formatISODate(new Date());
}

export function latestAvailableDate(): string {
  return addDays(today(), -ARCHIVE_LAG_DAYS);
}

export interface PeriodPreset {
  id: string;
  label: string;
  getRange: () => DateRange;
}

export const PERIOD_PRESETS: PeriodPreset[] = [
  {
    id: "7d",
    label: "7 derniers jours",
    getRange: () => ({ start: addDays(latestAvailableDate(), -6), end: latestAvailableDate() }),
  },
  {
    id: "30d",
    label: "30 derniers jours",
    getRange: () => ({ start: addDays(latestAvailableDate(), -29), end: latestAvailableDate() }),
  },
  {
    id: "3m",
    label: "3 derniers mois",
    getRange: () => ({ start: addMonths(latestAvailableDate(), -3), end: latestAvailableDate() }),
  },
  {
    id: "6m",
    label: "6 derniers mois",
    getRange: () => ({ start: addMonths(latestAvailableDate(), -6), end: latestAvailableDate() }),
  },
  {
    id: "1y",
    label: "12 derniers mois",
    getRange: () => ({ start: addYears(latestAvailableDate(), -1), end: latestAvailableDate() }),
  },
  {
    id: "ytd",
    label: "Depuis le 1er janvier",
    getRange: () => {
      const end = latestAvailableDate();
      const year = end.slice(0, 4);
      return { start: `${year}-01-01`, end };
    },
  },
];

/** Shifts a date range by a whole number of years, preserving its length (month/day). */
export function shiftRangeByYears(range: DateRange, years: number): DateRange {
  return {
    start: addYears(range.start, years),
    end: addYears(range.end, years),
  };
}

export function yearOf(iso: string): number {
  return Number(iso.slice(0, 4));
}

/** Shifts a date range to land on a specific target year, keeping its month/day window. */
export function shiftRangeToYear(range: DateRange, targetYear: number): DateRange {
  return shiftRangeByYears(range, targetYear - yearOf(range.start));
}

/**
 * Builds the same month/day window (i.e. the same date range) for each of the
 * `count` years preceding the reference range's year, most recent first.
 * Used to compare a period against the same period in past years, and to
 * compute multi-year normals / detect rainfall deficits.
 */
export function pastYearRanges(range: DateRange, count: number): DateRange[] {
  const ranges: DateRange[] = [];
  for (let i = 1; i <= count; i++) {
    ranges.push(shiftRangeByYears(range, -i));
  }
  return ranges;
}

/** The smallest date range that encloses all the given ranges. */
export function enclosingRange(ranges: DateRange[]): DateRange {
  let start = ranges[0].start;
  let end = ranges[0].end;
  for (const r of ranges) {
    if (r.start < start) start = r.start;
    if (r.end > end) end = r.end;
  }
  return { start, end };
}
