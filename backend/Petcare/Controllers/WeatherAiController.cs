using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PetCare.Core.Services.Contracts;
using PetCare.Core.Services.Weather;

namespace Petcare.Controllers;

/// <summary>
/// Public endpoint under <c>/api/WeatherAi</c> that returns a merged historical +
/// predicted weather forecast for a given city.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public sealed class WeatherAiController(IWeatherAiService service) : ControllerBase
{
    /// <summary>
    /// Returns the weather forecast for <paramref name="city"/>. Translates
    /// <see cref="WeatherApiException"/> into the same HTTP status it carries so the
    /// client sees the most accurate failure reason.
    /// </summary>
    [AllowAnonymous]
    [HttpGet]
    public async Task<IActionResult> Get(
        [FromQuery] string city,
        [FromQuery] int daysAhead = 4,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(city))
            return BadRequest(new { error = "Query parameter 'city' is required." });

        try
        {
            return Ok(await service.GetWeatherAiAsync(city, daysAhead, ct));
        }
        catch (WeatherApiException ex)
        {
            return StatusCode(ex.Status, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }
}
