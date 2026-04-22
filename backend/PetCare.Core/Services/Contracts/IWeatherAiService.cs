using PetCare.Core.Models;

namespace PetCare.Core.Services.Contracts
{
    /// <summary>
    /// Produces short-term weather forecasts for a city by combining historical observations
    /// with a regression-based prediction model.
    /// </summary>
    public interface IWeatherAiService
    {
        /// <summary>
        /// Retrieves historical weather for <paramref name="city"/> and produces a forecast
        /// for the requested number of future days.
        /// </summary>
        /// <param name="city">City name to forecast (e.g. "Sofia").</param>
        /// <param name="daysAhead">Number of days to predict into the future. Defaults to 4.</param>
        /// <param name="ct">Token used to cancel the underlying HTTP calls.</param>
        /// <returns>Merged historical + predicted series together with confidence metadata.</returns>
        Task<WeatherAiResponseModel> GetWeatherAiAsync(string city, int daysAhead = 4, CancellationToken ct = default);
    }
}
