using PetCare.Core.Models;

namespace PetCare.Core.Services.Weather;

/// <summary>
/// Deterministic synthetic forecast used when no OpenWeather API key is configured.
/// Produces a daily series that varies per city and per day-of-year so the
/// UI always has something realistic to visualize on first run.
/// </summary>
public static class DemoForecastProvider
{
    private const double BaseTempCelsius = 13.0;
    private const double SeasonalAmplitude = 12.0;
    private const double DailyWobbleAmplitude = 1.8;
    private const double DailyNoiseAmplitude = 1.0;
    private const double RainBaseline = 0.15;
    private const double RainWobbleAmplitude = 0.18;
    private const double RainNoiseAmplitude = 0.04;

    /// <summary>
    /// Generates a deterministic daily forecast starting from today (UTC).
    /// The city name seeds both a per-city bias and the pseudo-random noise,
    /// so the same city produces the same numbers on the same day.
    /// </summary>
    public static List<WeatherPointModel> Generate(string city, int days = 5)
    {
        var seed = StableHash(city.Trim().ToLowerInvariant());
        var rng = new Random(seed);

        var today = DateTime.UtcNow.Date;
        var dayOfYear = today.DayOfYear;

        var baseTemp = BaseTempCelsius + SeasonalTrend(dayOfYear) * SeasonalAmplitude + CityBias(seed);

        var result = new List<WeatherPointModel>(days);
        for (var i = 0; i < days; i++)
        {
            var temp = baseTemp
                + Math.Sin((dayOfYear + i) * 0.9) * DailyWobbleAmplitude
                + (rng.NextDouble() - 0.5) * 2.0 * DailyNoiseAmplitude;

            var rain = RainBaseline
                + ((seed >> (i % 16)) & 0x1F) / 90.0
                + Math.Sin((dayOfYear + i) * 0.6) * RainWobbleAmplitude
                + (rng.NextDouble() - 0.5) * 2.0 * RainNoiseAmplitude;

            result.Add(new WeatherPointModel
            {
                Date = today.AddDays(i).ToString("yyyy-MM-dd"),
                TempC = Math.Round(temp, 1),
                RainProb = Math.Round(Math.Clamp(rain, 0, 1), 3),
            });
        }

        return result;
    }

    /// <summary>Simple seasonal sine curve: negative in winter, positive in summer.</summary>
    private static double SeasonalTrend(int dayOfYear) =>
        Math.Sin((dayOfYear / 365.0) * 2 * Math.PI - Math.PI / 2);

    /// <summary>Small temperature offset in °C derived from the city seed.</summary>
    private static double CityBias(int seed) => (seed % 60 - 30) / 10.0;

    /// <summary>
    /// Simple 32-bit hash that is stable across runs (unlike <see cref="string.GetHashCode()"/>),
    /// so a given city always maps to the same seed.
    /// </summary>
    private static int StableHash(string input)
    {
        unchecked
        {
            var hash = 23;
            foreach (var c in input) hash = hash * 31 + c;
            return Math.Abs(hash == int.MinValue ? 0 : hash);
        }
    }
}
