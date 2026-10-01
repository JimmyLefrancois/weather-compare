// Shared types for the weather-compare application

/** A French commune (town/village), as returned by the geo.api.gouv.fr lookup. */
export interface Commune {
  code: string;
  nom: string;
  codePostal: string;
  latitude: number;
  longitude: number;
  population?: number;
}

/** Raw daily weather series as returned by the Open-Meteo archive API. */
export interface DailyWeatherSeries {
  time: string[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  temperature_2m_mean: number[];
  precipitation_sum: number[];
  precipitation_hours: number[];
  snowfall_sum: number[];
  windspeed_10m_max: number[];
  wind_gusts_10m_max: number[];
  relative_humidity_2m_mean: number[];
  sunshine_duration: number[];
}

/** A single day of weather data, "unpacked" from the parallel-array series above. */
export interface DailyWeatherRecord {
  date: string; // ISO yyyy-MM-dd
  tMax: number | null;
  tMin: number | null;
  tMean: number | null;
  precipitation: number | null;
  precipitationHours: number | null;
  snowfall: number | null;
  windMax: number | null;
  windGustMax: number | null;
  humidityMean: number | null;
  sunshineSeconds: number | null;
}

/** A date range, inclusive, in ISO yyyy-MM-dd format. */
export interface DateRange {
  start: string;
  end: string;
}

/** Aggregated indicators computed for a given period over a given set of daily records. */
export interface PeriodIndicators {
  range: DateRange;
  dayCount: number;
  /** Total precipitation in mm. */
  precipitationTotal: number;
  /** Number of days with precipitation >= 1mm. */
  rainyDays: number;
  /** Number of days with no measurable precipitation. */
  dryDays: number;
  /** Highest single-day precipitation in mm. */
  maxDailyPrecipitation: number;
  /** Average temperature in °C. */
  tempAvg: number | null;
  /** Lowest minimum temperature in °C. */
  tempMin: number | null;
  /** Highest maximum temperature in °C. */
  tempMax: number | null;
  /** Average daily thermal amplitude (tMax - tMin) in °C. */
  thermalAmplitudeAvg: number | null;
  /** Number of days with tMin < 0°C. */
  frostDays: number;
  /** Number of days with tMax >= 30°C. */
  hotDays: number;
  /** Total snowfall in cm. */
  snowfallTotal: number;
  /** Average daily max wind speed in km/h. */
  windAvg: number | null;
  /** Highest wind gust in km/h. */
  windGustMax: number | null;
  /** Average relative humidity in %. */
  humidityAvg: number | null;
  /** Total sunshine duration in hours. */
  sunshineHoursTotal: number;
}

/** How precipitation for a period compares against a reference/normal value. */
export type DeficitStatus = "deficit" | "surplus" | "normal";

export type ComparisonMode =
  | "custom"
  | "previousYear"
  | "specificYear"
  | "normalAverage"
  | "bestYear";

export interface YearlyPeriodSummary {
  year: number;
  range: DateRange;
  indicators: PeriodIndicators;
  precipitationDeltaVsNormal: number | null;
  deficitStatus: DeficitStatus | null;
}
