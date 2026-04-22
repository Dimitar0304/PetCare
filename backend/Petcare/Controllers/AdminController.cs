using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetCare.Core.Models;
using PetCare.Infrastructure.Data;

namespace Petcare.Controllers;

/// <summary>
/// Admin-only endpoints exposed under <c>/api/Admin</c>. Provides paged listings and
/// moderation actions over ads and messages. All endpoints require the <c>Admin</c> role.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public sealed class AdminController(PetcareDbContext context) : ControllerBase
{
    private const int DefaultPageSize = 20;
    private const int MaxPageSize = 100;

    /// <summary>Returns a paged list of every advertisement, joined with the owner's email.</summary>
    [HttpGet("ads")]
    public async Task<ActionResult<PagedResult<AdResponseModel>>> GetAds(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = DefaultPageSize,
        CancellationToken ct = default)
    {
        (page, pageSize) = NormalizePaging(page, pageSize);

        var total = await context.Ads.CountAsync(ct);

        var items = await context.Ads
            .AsNoTracking()
            .OrderByDescending(a => a.CreatedOn)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Join(context.Users,
                  a => a.OwnerId,
                  u => u.Id,
                  (a, u) => new AdResponseModel
                  {
                      Id = a.Id,
                      OwnerId = a.OwnerId,
                      OwnerEmail = u.Email ?? string.Empty,
                      Title = a.Title,
                      Description = a.Description,
                      StartDate = a.StartDate,
                      EndDate = a.EndDate,
                      Price = a.Price,
                      IsTrue = true,
                      ServiceType = a.TypeService,
                      Xcordinates = a.Xcordinates,
                      Ycordinates = a.Ycordinates,
                      Town = a.Town
                  })
            .ToListAsync(ct);

        return Ok(Page(items, total, page, pageSize));
    }

    /// <summary>Deletes an advertisement regardless of ownership.</summary>
    [HttpDelete("ads/{id}")]
    public async Task<IActionResult> DeleteAd([FromRoute] string id, CancellationToken ct)
    {
        var ad = await context.Ads.FindAsync([id], ct);
        if (ad is null) return NotFound();

        context.Ads.Remove(ad);
        await context.SaveChangesAsync(ct);
        return Ok();
    }

    /// <summary>Returns a paged list of every message in the system, newest first.</summary>
    [HttpGet("messages")]
    public async Task<ActionResult<PagedResult<MessageResponseModel>>> GetMessages(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = DefaultPageSize,
        CancellationToken ct = default)
    {
        (page, pageSize) = NormalizePaging(page, pageSize);

        var total = await context.Messages.CountAsync(ct);

        var items = await context.Messages
            .AsNoTracking()
            .OrderByDescending(m => m.SentAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(m => new MessageResponseModel
            {
                Id = m.Id,
                SenderId = m.SenderId,
                SenderEmail = m.SenderEmail,
                RecipientEmail = m.RecipientEmail,
                Subject = m.Subject,
                Body = m.Body,
                SentAt = m.SentAt,
                IsRead = m.IsRead
            })
            .ToListAsync(ct);

        return Ok(Page(items, total, page, pageSize));
    }

    /// <summary>Forces a message into the read state regardless of recipient.</summary>
    [HttpPost("messages/read/{id}")]
    public async Task<IActionResult> MarkMessageRead([FromRoute] string id, CancellationToken ct)
    {
        var msg = await context.Messages.FindAsync([id], ct);
        if (msg is null) return NotFound();

        msg.IsRead = true;
        await context.SaveChangesAsync(ct);
        return Ok();
    }

    /// <summary>Permanently deletes a message.</summary>
    [HttpDelete("messages/{id}")]
    public async Task<IActionResult> DeleteMessage([FromRoute] string id, CancellationToken ct)
    {
        var msg = await context.Messages.FindAsync([id], ct);
        if (msg is null) return NotFound();

        context.Messages.Remove(msg);
        await context.SaveChangesAsync(ct);
        return Ok();
    }

    private static (int page, int pageSize) NormalizePaging(int page, int pageSize) =>
    (
        Math.Max(page, 1),
        pageSize is < 1 or > MaxPageSize ? DefaultPageSize : pageSize
    );

    private static PagedResult<T> Page<T>(List<T> items, int total, int page, int pageSize) =>
        new() { Items = items, Total = total, Page = page, PageSize = pageSize };
}
