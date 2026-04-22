namespace PetCare.Core.Models
{
    /// <summary>
    /// Represents a single weather observation or prediction for a given day.
    /// </summary>
    public class WeatherPointModel
    {
        /// <summary>Date of the observation in ISO-8601 <c>yyyy-MM-dd</c> format.</summary>
        public string Date { get; set; } = string.Empty;

        /// <summary>Temperature in degrees Celsius.</summary>
        public double TempC { get; set; }

        /// <summary>Probability of precipitation expressed as a value in the range 0..1.</summary>
        public double RainProb { get; set; }
    }

    /// <summary>
    /// Weather point used in the merged forecast timeline, tagged with its origin
    /// so the client can render real vs. predicted points differently.
    /// </summary>
    public class MergedWeatherPointModel : WeatherPointModel
    {
        /// <summary>
        /// Source of the data point. Typical values are <c>"real"</c> for observed
        /// values and <c>"predicted"</c> for values produced by the regression model.
        /// </summary>
        public string Kind { get; set; } = "real";
    }

    /// <summary>
    /// Confidence metrics describing the quality of the produced forecast.
    /// </summary>
    public class WeatherConfidenceModel
    {
        /// <summary>Confidence score for the temperature prediction in the range 0..1.</summary>
        public double Temp { get; set; }

        /// <summary>Confidence score for the rain-probability prediction in the range 0..1.</summary>
        public double RainProb { get; set; }

        /// <summary>Name of the statistical method used to produce the forecast.</summary>
        public string Method { get; set; } = "linear_regression";

        /// <summary>Human-readable notes about the forecast (e.g. limited data warnings).</summary>
        public string Notes { get; set; } = string.Empty;
    }

    /// <summary>
    /// Aggregate response returned by the Weather AI endpoint. Contains the observed
    /// history, the model's predictions, a merged timeline for charting, and
    /// confidence metadata.
    /// </summary>
    public class WeatherAiResponseModel
    {
        /// <summary>City for which the forecast was produced.</summary>
        public string City { get; set; } = string.Empty;

        /// <summary>
        /// Origin of the underlying data. <c>"openweather"</c> indicates live data from
        /// the OpenWeather API; <c>"demo"</c> is used when no API key is configured and
        /// the demo forecast provider is used as a fallback.
        /// </summary>
        public string Source { get; set; } = "openweather";

        /// <summary>UTC timestamp at which the response was produced.</summary>
        public DateTime GeneratedAt { get; set; }

        /// <summary>Observed historical weather points.</summary>
        public List<WeatherPointModel> Real { get; set; } = new();

        /// <summary>Future weather points produced by the prediction model.</summary>
        public List<WeatherPointModel> Predicted { get; set; } = new();

        /// <summary>Historical and predicted points combined into a single chronological series.</summary>
        public List<MergedWeatherPointModel> Merged { get; set; } = new();

        /// <summary>Confidence metrics for the predicted portion of the series.</summary>
        public WeatherConfidenceModel Confidence { get; set; } = new();
    }
}
