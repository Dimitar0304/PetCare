using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PetCare.Core.Models;
using PetCare.Core.Services.Contracts;

namespace Petcare.Controllers;

/// <summary>
/// Exposes CRUD endpoints for pet-care advertisements under <c>/api/Ad</c>.
/// Read operations are anonymous; write operations require an authenticated user
/// and verify ownership in the service layer.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public sealed class AdController(IAdService service) : ControllerBase
{
    /// <summary>Returns a paged list of advertisements ordered by creation date (newest first).</summary>
    [AllowAnonymous]
    [HttpGet("getAll")]
    public async Task<ActionResult<PagedResult<AdResponseModel>>> Get(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20) =>
        Ok(await service.GetAdsPageAsync(page, pageSize));

    /// <summary>Creates a new advertisement for the current user.</summary>
    [Authorize]
    [HttpPost("create")]
    public async Task<IActionResult> CreateAd([FromBody] AdRequestModel model)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var result = await service.CreateAnAdAsync(model);
        return result.IsTrue ? Ok(result) : BadRequest();
    }

    /// <summary>Updates an existing advertisement owned by the current user.</summary>
    [Authorize]
    [HttpPut("update/{id}")]
    public async Task<IActionResult> UpdateAd([FromRoute] string id, [FromBody] AdRequestModel model)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        try
        {
            return Ok(await service.UpdateAdAsync(id, model));
        }
        catch (UnauthorizedAccessException) { return Forbid(); }
        catch (ArgumentNullException) { return NotFound(); }
    }

    /// <summary>Deletes an advertisement owned by the current user.</summary>
    [Authorize]
    [HttpPost("delete")]
    public async Task<IActionResult> DeleteAdById(string id)
    {
        if (id is null) return BadRequest();

        try
        {
            await service.DeleteAdAsync(id);
            return Ok();
        }
        catch (UnauthorizedAccessException) { return Forbid(); }
        catch (ArgumentNullException) { return NotFound(); }
    }

    /// <summary>Retrieves a single advertisement by id.</summary>
    [HttpGet("getById")]
    [AllowAnonymous]
    public async Task<IActionResult> GetByIdAsync(string id)
    {
        if (id is null) return BadRequest();

        var result = await service.GetAdByIdAsync(id);
        if (result is null || !result.IsTrue) return NotFound();

        return Ok(result);
    }
}
