using System.Net;
using System.Net.Http.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Configuration;

namespace PetCare.Core.Services.Weather;

/// <summary>
/// Thin typed wrapper around the OpenWeatherMap 5-day / 3-hour forecast endpoint.
/// Reads the API key from <c>OpenWeather:ApiKey</c> and maps HTTP failures to
/// <see cref="WeatherApiException"/> with sanitized status codes.
/// </summary>
public sealed class OpenWeatherClient(HttpClient http, IConfiguration config)
{
    private const string BaseUrl = "https://api.openweathermap.org/data/2.5/forecast";
    private readonly string _apiKey = config["OpenWeather:ApiKey"] ?? string.Empty;

    /// <summary>Fetches the 5-day / 3-hour forecast for the given city in metric units.</summary>
    public async Task<OpenWeatherForecastDto> GetForecastAsync(string city, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(_apiKey))
            throw new WeatherApiException("OpenWeather API key is not configured.", 500);

        var url = $"{BaseUrl}?q={Uri.EscapeDataString(city)}" +
                  $"&appid={Uri.EscapeDataString(_apiKey)}" +
                  $"&units=metric";

        using var response = await http.GetAsync(url, ct);

        if (!response.IsSuccessStatusCode)
            throw MapHttpFailure(response.StatusCode, city);

        var data = await response.Content.ReadFromJsonAsync<OpenWeatherForecastDto>(cancellationToken: ct);
        if (data is null || data.List is null || data.List.Count == 0 || data.City is null)
            throw new WeatherApiException("Unexpected OpenWeatherMap response shape.", 502);

        return data;
    }

    /// <summary>Translates an HTTP failure status into a <see cref="WeatherApiException"/>.</summary>
    private static WeatherApiException MapHttpFailure(HttpStatusCode status, string city) => status switch
    {
        HttpStatusCode.NotFound => new WeatherApiException($"City '{city}' not found.", 404),
        HttpStatusCode.Unauthorized => new WeatherApiException(
            "OpenWeather API key is invalid or not activated yet.", 401),
        _ => new WeatherApiException($"OpenWeatherMap error ({(int)status}).", 502),
    };
}

/// <summary>
/// Exception carrying an HTTP-style <see cref="Status"/> code so the controller layer
/// can translate weather-provider failures into appropriate API responses.
/// </summary>
public sealed class WeatherApiException(string message, int status) : Exception(message)
{
    /// <summary>HTTP-style status code associated with the failure.</summary>
    public int Status { get; } = status;
}

/// <summary>Top-level OpenWeatherMap 5-day / 3-hour forecast payload.</summary>
public class OpenWeatherForecastDto
{
    [JsonPropertyName("city")] public OpenWeatherCityDto? City { get; set; }
    [JsonPropertyName("list")] public List<OpenWeatherListItemDto>? List { get; set; }
}

/// <summary>City metadata returned alongside the forecast.</summary>
public class OpenWeatherCityDto
{
    [JsonPropertyName("name")] public string Name { get; set; } = string.Empty;
    [JsonPropertyName("country")] public string? Country { get; set; }
}

/// <summary>A single 3-hour forecast sample.</summary>
public class OpenWeatherListItemDto
{
    [JsonPropertyName("dt")] public long Dt { get; set; }
    [JsonPropertyName("main")] public OpenWeatherMainDto Main { get; set; } = new();
    [JsonPropertyName("pop")] public double? Pop { get; set; }
    [JsonPropertyName("rain")] public OpenWeatherRainDto? Rain { get; set; }
    [JsonPropertyName("weather")] public List<OpenWeatherConditionDto>? Weather { get; set; }
}

/// <summary>Main atmospheric values from the forecast provider.</summary>
public class OpenWeatherMainDto
{
    [JsonPropertyName("temp")] public double Temp { get; set; }
    [JsonPropertyName("humidity")] public double? Humidity { get; set; }
}

/// <summary>Rain volume block of the forecast sample.</summary>
public class OpenWeatherRainDto
{
    [JsonPropertyName("3h")] public double? ThreeHour { get; set; }
}

/// <summary>Condition summary entry (grouping / icon).</summary>
public class OpenWeatherConditionDto
{
    [JsonPropertyName("main")] public string Main { get; set; } = string.Empty;
    [JsonPropertyName("icon")] public string Icon { get; set; } = string.Empty;
}
