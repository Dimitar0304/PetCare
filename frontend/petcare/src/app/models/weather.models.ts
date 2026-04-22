/**
 * Single observed or predicted weather point for a given day.
 */
export interface WeatherPointDto {
  /** ISO-8601 date in `yyyy-MM-dd` format. */
  date: string;
  /** Temperature in degrees Celsius. */
  tempC: number;
  /** Probability of precipitation in the range 0..1. */
  rainProb: number;
}

/**
 * Weather point with a tag indicating whether it comes from the observed
 * history or the prediction model.
 */
export interface MergedWeatherPointDto extends WeatherPointDto {
  kind: 'real' | 'predicted';
}

/**
 * Confidence metrics that accompany a weather forecast response.
 */
export interface WeatherConfidenceDto {
  /** Confidence for the temperature prediction (0..1). */
  temp: number;
  /** Confidence for the rain-probability prediction (0..1). */
  rainProb: number;
  method: 'linear_regression';
  /** Human-readable notes (e.g. fallback explanations). */
  notes: string;
}

/**
 * Source of the weather data: live OpenWeather data or the built-in demo
 * provider used when no API key is configured.
 */
export type WeatherSource = 'openweather' | 'demo';

/**
 * Aggregate Weather AI response with observed history, predictions, a merged
 * timeline for charting, and confidence metadata.
 */
export interface WeatherAiResponseDto {
  city: string;
  source: WeatherSource;
  /** ISO-8601 UTC timestamp marking when the response was produced. */
  generatedAt: string;
  real: WeatherPointDto[];
  predicted: WeatherPointDto[];
  merged: MergedWeatherPointDto[];
  confidence: WeatherConfidenceDto;
}
