import type { DailyWeatherRecord, DailyWeatherSeries } from "../types";

const DAILY_VARIABLES = [
  "temperature_2m_max",
  "temperature_2m_min",
  "temperature_2m_mean",
  "precipitation_sum",
  "precipitation_hours",
  "snowfall_sum",
  "windspeed_10m_max",
  "wind_gusts_10m_max",
  "relative_humidity_2m_mean",
  "sunshine_duration",
].join(",");

/**
 * Fetches the raw daily weather series from the free, keyless Open-Meteo
 * historical archive API for a given location and date range (inclusive,
 * ISO yyyy-MM-dd). The archive typically lags a few days behind "today",
 * so very recent days may come back as null and are filtered out when the
 * series is unpacked into records.
 */
export async function fetchDailyWeatherSeries(
  latitude: number,
  longitude: number,
  startDate: string,
  endDate: string,
): Promise<DailyWeatherSeries> {
  const url = new URL("https://archive-api.open-meteo.com/v1/archive");
  url.searchParams.set("latitude", latitude.toString());
  url.searchParams.set("longitude", longitude.toString());
  url.searchParams.set("start_date", startDate);
  url.searchParams.set("end_date", endDate);
  url.searchParams.set("daily", DAILY_VARIABLES);
  url.searchParams.set("timezone", "Europe/Paris");

  const response = await fetch(url.toString());
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Erreur lors de la récupération des données météo (${response.status}). ${body}`,
    );
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(data.reason ?? "Erreur inconnue de l'API météo.");
  }

  return data.daily as DailyWeatherSeries;
}

/** Unpacks the parallel-array series returned by the API into one record per day. */
export function unpackSeries(series: DailyWeatherSeries): DailyWeatherRecord[] {
  return series.time.map((date, i) => ({
    date,
    tMax: series.temperature_2m_max[i] ?? null,
    tMin: series.temperature_2m_min[i] ?? null,
    tMean: series.temperature_2m_mean[i] ?? null,
    precipitation: series.precipitation_sum[i] ?? null,
    precipitationHours: series.precipitation_hours[i] ?? null,
    snowfall: series.snowfall_sum[i] ?? null,
    windMax: series.windspeed_10m_max[i] ?? null,
    windGustMax: series.wind_gusts_10m_max[i] ?? null,
    humidityMean: series.relative_humidity_2m_mean[i] ?? null,
    sunshineSeconds: series.sunshine_duration[i] ?? null,
  }));
}
