using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using PetCare.Core.Models;
using PetCare.Core.Services.Contracts;
using PetCare.Infrastructure.Data;
using PetCare.Infrastructure.Data.Models;
using System.Security.Claims;

namespace PetCare.Core.Services.Ads;

/// <summary>
/// EF Core-backed implementation of <see cref="IAdService"/>.
/// Resolves the current user from the HTTP context to enforce ownership on write operations.
/// </summary>
public sealed class AdService(PetcareDbContext context, IHttpContextAccessor httpContextAccessor) : IAdService
{
    private const int DefaultPageSize = 20;
    private const int MaxPageSize = 100;
    private const int DefaultCareWindowDays = 7;

    /// <summary>
    /// Creates a new advertisement owned by the current user. When the client omits
    /// <c>StartDate</c> or <c>EndDate</c>, the service defaults them to "today" and
    /// "today + 7 days" respectively to satisfy the non-null DB schema.
    /// </summary>
    public async Task<AdResponseModel> CreateAnAdAsync(AdRequestModel model)
    {
        if (model is null)
        {
            return Failure("Invalid request model.");
        }

        var userId = GetCurrentUserId() ?? throw new UnauthorizedAccessException();

        var start = model.StartDate ?? DateTime.UtcNow;
        var ad = new Ad
        {
            Id = Guid.NewGuid().ToString(),
            Title = model.Title,
            Description = model.Description,
            Town = model.Town,
            Price = model.Price,
            StartDate = start,
            EndDate = model.EndDate ?? start.AddDays(DefaultCareWindowDays),
            TypeService = model.ServiceType,
            Ycordinates = model.Ycordinates,
            Xcordinates = model.Xcordinates,
            CreatedOn = DateTime.UtcNow,
            OwnerId = userId,
        };

        await context.Ads.AddAsync(ad);
        await context.SaveChangesAsync();

        return ToResponse(ad, GetCurrentUserEmail() ?? string.Empty);
    }

    /// <summary>Deletes an advertisement after verifying that the current user is its owner.</summary>
    public async Task<int> DeleteAdAsync(string id)
    {
        var ad = await LoadOwnedAdAsync(id);

        context.Ads.Remove(ad);
        await context.SaveChangesAsync();
        return 1;
    }

    /// <summary>Retrieves a single advertisement by id, including the owner's email.</summary>
    public async Task<AdResponseModel> GetAdByIdAsync(string id)
    {
        var result = await BuildAdQuery(context.Ads.AsNoTracking().Where(a => a.Id == id))
            .FirstOrDefaultAsync();

        return result ?? Failure("Non Existing Ad");
    }

    /// <summary>Returns every advertisement in the database, newest first, joined with the owner's email.</summary>
    public Task<List<AdResponseModel>> GetAllAdsAsync() =>
        BuildAdQuery(context.Ads.AsNoTracking().OrderByDescending(a => a.CreatedOn))
            .ToListAsync();

    /// <summary>Returns a page of advertisements ordered by creation date (newest first).</summary>
    public async Task<PagedResult<AdResponseModel>> GetAdsPageAsync(int page, int pageSize)
    {
        (page, pageSize) = NormalizePaging(page, pageSize);

        var total = await context.Ads.CountAsync();

        var pageQuery = context.Ads
            .AsNoTracking()
            .OrderByDescending(a => a.CreatedOn)
            .Skip((page - 1) * pageSize)
            .Take(pageSize);

        var items = await BuildAdQuery(pageQuery).ToListAsync();

        return new PagedResult<AdResponseModel>
        {
            Items = items,
            Total = total,
            Page = page,
            PageSize = pageSize,
        };
    }

    /// <summary>Updates an existing advertisement after verifying that the current user is its owner.</summary>
    public async Task<AdResponseModel> UpdateAdAsync(string adId, AdRequestModel model)
    {
        ArgumentNullException.ThrowIfNull(model);

        var ad = await LoadOwnedAdAsync(adId);

        ad.Title = model.Title;
        ad.Description = model.Description;
        ad.Town = model.Town;
        ad.Price = model.Price;
        ad.StartDate = model.StartDate ?? ad.StartDate;
        ad.EndDate = model.EndDate ?? ad.EndDate;
        ad.TypeService = model.ServiceType;
        ad.Xcordinates = model.Xcordinates;
        ad.Ycordinates = model.Ycordinates;

        await context.SaveChangesAsync();

        return ToResponse(ad, GetCurrentUserEmail() ?? string.Empty);
    }

    /// <summary>Loads an ad by id and ensures the current user owns it.</summary>
    /// <exception cref="UnauthorizedAccessException">No authenticated user or caller is not the owner.</exception>
    /// <exception cref="ArgumentNullException">No ad exists with the supplied id.</exception>
    private async Task<Ad> LoadOwnedAdAsync(string id)
    {
        var userId = GetCurrentUserId() ?? throw new UnauthorizedAccessException();

        var ad = await context.Ads.FirstOrDefaultAsync(a => a.Id == id)
            ?? throw new ArgumentNullException(nameof(id), "Ad not found.");

        if (ad.OwnerId != userId)
            throw new UnauthorizedAccessException("You can only modify your own ads.");

        return ad;
    }

    /// <summary>Shared projection from <see cref="Ad"/> + <see cref="User"/> to <see cref="AdResponseModel"/>.</summary>
    private IQueryable<AdResponseModel> BuildAdQuery(IQueryable<Ad> source) =>
        source.Join(
            context.Users,
            a => a.OwnerId,
            u => u.Id,
            (a, u) => new AdResponseModel
            {
                Id = a.Id,
                OwnerId = a.OwnerId,
                OwnerEmail = u.Email ?? string.Empty,
                Title = a.Title,
                Description = a.Description,
                EndDate = a.EndDate,
                StartDate = a.StartDate,
                Price = a.Price,
                IsTrue = true,
                ServiceType = a.TypeService,
                Xcordinates = a.Xcordinates,
                Ycordinates = a.Ycordinates,
                Town = a.Town,
            });

    /// <summary>Maps a persisted <see cref="Ad"/> to its response DTO.</summary>
    private static AdResponseModel ToResponse(Ad ad, string ownerEmail) => new()
    {
        Id = ad.Id,
        OwnerId = ad.OwnerId,
        OwnerEmail = ownerEmail,
        Title = ad.Title,
        Description = ad.Description,
        EndDate = ad.EndDate,
        StartDate = ad.StartDate,
        Price = ad.Price,
        IsTrue = true,
        ServiceType = ad.TypeService,
        Xcordinates = ad.Xcordinates,
        Ycordinates = ad.Ycordinates,
        Town = ad.Town,
        Erors = new List<string>(),
    };

    private static AdResponseModel Failure(string error) => new()
    {
        IsTrue = false,
        Erors = new List<string> { error },
    };

    private static (int page, int pageSize) NormalizePaging(int page, int pageSize) =>
    (
        Math.Max(page, 1),
        pageSize is < 1 or > MaxPageSize ? DefaultPageSize : pageSize
    );

    /// <summary>Reads the current user's id from the ClaimsPrincipal with fallbacks for common claim names.</summary>
    private string? GetCurrentUserId() =>
        GetClaim(ClaimTypes.NameIdentifier, "nameid", "sub");

    /// <summary>Reads the current user's email from the ClaimsPrincipal with fallbacks for common claim names.</summary>
    private string? GetCurrentUserEmail() =>
        GetClaim(ClaimTypes.Email, "email");

    private string? GetClaim(params string[] names)
    {
        var user = httpContextAccessor.HttpContext?.User;
        if (user is null) return null;

        foreach (var name in names)
        {
            var value = user.FindFirstValue(name);
            if (!string.IsNullOrEmpty(value)) return value;
        }
        return null;
    }
}
