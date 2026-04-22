using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using PetCare.Core.Models;
using PetCare.Core.Services.Contracts;

namespace PetCare.Core.Services.Weather;

/// <summary>
/// Service that combines historical weather (from OpenWeatherMap or a demo generator)
/// with a simple linear-regression model to produce a short-term forecast.
/// Responses are memory-cached for 5 minutes per (city, daysAhead) pair.
/// </summary>
public sealed class WeatherAiService(
    OpenWeatherClient client,
    IMemoryCache cache,
    IConfiguration config) : IWeatherAiService
{
    private const int MinDaysAhead = 1;
    private const int MaxDaysAhead = 10;
    private const int DemoDays = 5;
    private static readonly TimeSpan CacheTtl = TimeSpan.FromMinutes(5);

    /// <summary>
    /// Returns a merged historical + predicted weather series for <paramref name="city"/>.
    /// Falls back to the <see cref="DemoForecastProvider"/> when no API key is configured,
    /// and annotates the confidence notes accordingly.
    /// </summary>
    public async Task<WeatherAiResponseModel> GetWeatherAiAsync(
        string city,
        int daysAhead = 4,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(city))
            throw new WeatherApiException("City is required.", 400);

        daysAhead = Math.Clamp(daysAhead, MinDaysAhead, MaxDaysAhead);

        var cacheKey = $"weatherai::{city.Trim().ToLowerInvariant()}::{daysAhead}";
        if (cache.TryGetValue<WeatherAiResponseModel>(cacheKey, out var cached) && cached is not null)
            return cached;

        var (daily, resolvedCity, source) = await LoadHistoryAsync(city, ct);
        var (predicted, confidence) = Predict(daily, daysAhead);

        if (source == "demo")
            confidence.Notes = "Demo mode — OpenWeather API key not configured. " + confidence.Notes;

        var response = new WeatherAiResponseModel
        {
            City = resolvedCity,
            Source = source,
            GeneratedAt = DateTime.UtcNow,
            Real = daily,
            Predicted = predicted,
            Merged = BuildMerged(daily, predicted),
            Confidence = confidence,
        };

        cache.Set(cacheKey, response, CacheTtl);
        return response;
    }

    /// <summary>Loads the historical daily series either from OpenWeather or the demo provider.</summary>
    private async Task<(List<WeatherPointModel> daily, string resolvedCity, string source)> LoadHistoryAsync(
        string city, CancellationToken ct)
    {
        var hasApiKey = !string.IsNullOrWhiteSpace(config["OpenWeather:ApiKey"]);
        if (!hasApiKey)
        {
            return (DemoForecastProvider.Generate(city, DemoDays), city.Trim(), "demo");
        }

        var forecast = await client.GetForecastAsync(city, ct);
        return (ToDailySeries(forecast), forecast.City!.Name, "openweather");
    }

    /// <summary>Combines real and predicted samples into a single ordered series for charting.</summary>
    private static List<MergedWeatherPointModel> BuildMerged(
        List<WeatherPointModel> real, List<WeatherPointModel> predicted)
    {
        var merged = new List<MergedWeatherPointModel>(real.Count + predicted.Count);
        merged.AddRange(real.Select(p => ToMerged(p, "real")));
        merged.AddRange(predicted.Select(p => ToMerged(p, "predicted")));
        return merged;
    }

    private static MergedWeatherPointModel ToMerged(WeatherPointModel p, string kind) => new()
    {
        Date = p.Date,
        TempC = p.TempC,
        RainProb = p.RainProb,
        Kind = kind,
    };

    /// <summary>
    /// Collapses OpenWeather's 3-hour samples into one point per day by averaging
    /// temperature and preferring the reported <c>pop</c> (probability of precipitation);
    /// when <c>pop</c> is missing it estimates rain probability from the fraction of
    /// 3-hour slots that actually reported rain.
    /// </summary>
    private static List<WeatherPointModel> ToDailySeries(OpenWeatherForecastDto forecast)
    {
        var byDay = new Dictionary<string, DayAggregate>();

        foreach (var item in forecast.List!)
        {
            var dayKey = DateTimeOffset.FromUnixTimeSeconds(item.Dt).UtcDateTime.ToString("yyyy-MM-dd");
            if (!byDay.TryGetValue(dayKey, out var agg))
            {
                agg = new DayAggregate();
                byDay[dayKey] = agg;
            }

            agg.Temps.Add(item.Main.Temp);
            if (item.Pop.HasValue) agg.Pops.Add(item.Pop.Value);
            if (item.Rain?.ThreeHour is > 0) agg.RainHits++;
        }

        return byDay
            .OrderBy(kv => kv.Key, StringComparer.Ordinal)
            .Select(kv => kv.Value.ToPoint(kv.Key))
            .ToList();
    }

    /// <summary>
    /// Produces a <paramref name="daysAhead"/>-point linear extrapolation of temperature
    /// and rain probability together with a confidence score. The confidence blends the
    /// regression R² with a data-volume factor so very short histories penalize confidence.
    /// </summary>
    private static (List<WeatherPointModel> predicted, WeatherConfidenceModel confidence) Predict(
        List<WeatherPointModel> real, int daysAhead)
    {
        if (real.Count == 0)
        {
            return (new List<WeatherPointModel>(), new WeatherConfidenceModel
            {
                Temp = 0,
                RainProb = 0,
                Method = "linear_regression",
                Notes = "No real data",
            });
        }

        var tempReg = LinearRegression.Fit(real.Select(r => r.TempC).ToList());
        var popReg = LinearRegression.Fit(real.Select(r => r.RainProb).ToList());

        var lastDate = DateTime.ParseExact(real[^1].Date, "yyyy-MM-dd", null);
        var n = real.Count;

        var predicted = new List<WeatherPointModel>(daysAhead);
        for (var i = 1; i <= daysAhead; i++)
        {
            var x = (n - 1) + i;
            predicted.Add(new WeatherPointModel
            {
                Date = lastDate.AddDays(i).ToString("yyyy-MM-dd"),
                TempC = Math.Round(tempReg.Slope * x + tempReg.Intercept, 2),
                RainProb = Math.Round(Clamp01(popReg.Slope * x + popReg.Intercept), 3),
            });
        }

        var dataFactor = Clamp01((n - 2) / 5.0);
        var confidence = new WeatherConfidenceModel
        {
            Temp = Math.Round(ConfidenceFor(tempReg.R2, dataFactor), 3),
            RainProb = Math.Round(ConfidenceFor(popReg.R2, dataFactor), 3),
            Method = "linear_regression",
            Notes = $"r2(temp)={tempReg.R2:F2}, r2(pop)={popReg.R2:F2}, n={n}",
        };

        return (predicted, confidence);
    }

    /// <summary>Blends regression R² with a data-volume factor into a [0, 1] confidence score.</summary>
    private static double ConfidenceFor(double r2, double dataFactor) =>
        Clamp01(Clamp01(0.15 + 0.85 * r2) * (0.5 + 0.5 * dataFactor));

    private static double Clamp01(double v) => Math.Clamp(v, 0, 1);

    /// <summary>Accumulator used while collapsing OpenWeather's 3-hour samples into a single per-day data point.</summary>
    private sealed class DayAggregate
    {
        public List<double> Temps { get; } = new();
        public List<double> Pops { get; } = new();
        public int RainHits { get; set; }

        public WeatherPointModel ToPoint(string dayKey)
        {
            var rain = Pops.Count > 0 ? Pops.Average() : RainHits / 8.0;
            return new WeatherPointModel
            {
                Date = dayKey,
                TempC = Math.Round(Temps.Average(), 2),
                RainProb = Math.Round(Math.Clamp(rain, 0, 1), 3),
            };
        }
    }
}
