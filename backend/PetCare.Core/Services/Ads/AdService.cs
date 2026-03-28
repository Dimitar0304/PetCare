using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using PetCare.Core.Models;
using PetCare.Core.Services.Contracts;
using PetCare.Infrastructure.Data;
using PetCare.Infrastructure.Data.Models;
using System.Security.Claims;
using System;

namespace PetCare.Core.Services.Ads
{
    public class AdService : IAdService
    {
        private readonly PetcareDbContext context;
        private readonly IHttpContextAccessor httpContextAccessor;
        public AdService(PetcareDbContext _context, IHttpContextAccessor httpContextAccessor)
        {
            context = _context;
            this.httpContextAccessor = httpContextAccessor;
        }
        public async Task<AdResponseModel> CreateAnAdAsync(AdRequestModel model)
        {
            if (model == null)
            {
                return new AdResponseModel
                {
                    IsTrue = false,
                    Erors = new List<string> { "Invalid request model." }
                };
            }
            var userId = GetCurrentUserId();
            if (userId == null)
            {
                throw new UnauthorizedAccessException();
            }
            var ad = new Ad()
            {
                Id = Guid.NewGuid().ToString(),
                Title = model.Title,
                Description = model.Description,
                Town = model.Town,
                Price = model.Price,
                // DB schema requires non-null StartDate/EndDate.
                // If client doesn't provide them, default to a short care window.
                StartDate = model.StartDate ?? DateTime.UtcNow,
                EndDate = model.EndDate ?? (model.StartDate ?? DateTime.UtcNow).AddDays(7),
                TypeService = model.ServiceType,
                Ycordinates = model.Ycordinates,
                Xcordinates = model.Xcordinates,
                CreatedOn = DateTime.UtcNow,
                OwnerId = GetCurrentUserId()

            };

            await context.Ads.AddAsync(ad);
            await context.SaveChangesAsync();

            return new AdResponseModel()
            {
                Id = ad.Id,
                OwnerId = ad.OwnerId,
                IsTrue = true,
                Title = model.Title,
                Description = model.Description,
                Price = model.Price,
                EndDate = ad.EndDate,
                StartDate = ad.StartDate,
                ServiceType = model.ServiceType,
                Xcordinates = model.Xcordinates,
                Ycordinates = model.Ycordinates,
                Town = model.Town,
                Erors = new List<string>()
            };

        }

        public async Task<int> DeleteAdAsync(string id)
        {
            var userId = GetCurrentUserId();
            var ad = await context.Ads.FirstOrDefaultAsync(a => a.Id == id);

            if (ad == null)
            {
                throw new ArgumentNullException(nameof(id), "Ad not found.");
            }

            if (ad.OwnerId != userId)
            {
                throw new UnauthorizedAccessException("You can only delete your own ads.");
            }

            context.Ads.Remove(ad);
            await context.SaveChangesAsync();

            return 1;
        }

        public async Task<AdResponseModel> GetAdByIdAsync(string id)
        {
            var ad = await context.Ads.AsNoTracking().FirstOrDefaultAsync(a => a.Id == id);

            if(ad==null)
            {
                return new AdResponseModel()
                {
                    IsTrue = false,
                    Erors= new List<string>() { "Non Existing Ad"}
                };
            }

            return new AdResponseModel()
            {
                Id = ad.Id,
                OwnerId = ad.OwnerId,
                Title = ad.Title,
                Description = ad.Description,
                EndDate = ad.EndDate,
                StartDate = ad.StartDate,
                ServiceType = ad.TypeService,
                Price = ad.Price,
                Xcordinates = ad.Xcordinates,
                Ycordinates = ad.Ycordinates,
                Town = ad.Town,
                IsTrue = true
            };
        }

        public async Task<List<AdResponseModel>> GetAllAdsAsync()
        {
            var ads = await context.Ads.AsNoTracking().Select(a => new AdResponseModel()
            {
                Id = a.Id,
                OwnerId = a.OwnerId,
                Title = a.Title,
                Description = a.Description,
                EndDate = a.EndDate,
                StartDate = a.StartDate,
                Price = a.Price,
                IsTrue = true,
                ServiceType = a.TypeService,
                Xcordinates = a.Xcordinates,
                Ycordinates = a.Ycordinates,
                Town = a.Town
            }).ToListAsync();

            if (ads.Count == 0)
            {
                // No ads is a valid state; the frontend should display an empty list.
                return new List<AdResponseModel>();
            }
            return ads;
        }

        public async Task UpdateAdAsync(AdRequestModel model, string adId)
        {
            var currentAd =await context.Ads.FirstOrDefaultAsync(a => a.Id == adId);

            if (currentAd == null)
            {
                throw new ArgumentNullException();
            }

            currentAd = new Ad()
            {
                Description=model.Description,
                Title = model.Title,
                EndDate = model.EndDate,
                StartDate = model.StartDate,
                Price = model.Price,
                Town = model.Town,
                TypeService = model.ServiceType,
                Xcordinates = model.Xcordinates,
                Ycordinates =model.Ycordinates
             };

            context.Ads.Update(currentAd);
            await context.SaveChangesAsync();
        }
        private string? GetCurrentUserId()
        {
            var user = httpContextAccessor.HttpContext?.User;
            if (user == null) return null;

            // .NET 9 JsonWebTokenHandler may not remap short JWT claim names unless
            // MapInboundClaims=true. Try full CLR type, then short names as fallback.
            return user.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? user.FindFirstValue("nameid")
                ?? user.FindFirstValue("sub");
        }
    }
}
