using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using PetCare.Core.Models;
using PetCare.Core.Services.Contracts;
using PetCare.Infrastructure.Data;
using PetCare.Infrastructure.Data.Models;
using System.Security.Claims;

namespace PetCare.Core.Services.Ads
{
    public class AdService : IAdService
    {
        private readonly PetcareDbContext context;
        private readonly HttpContextAccessor httpContextAccessor;
        public AdService(PetcareDbContext _context, HttpContextAccessor httpContextAccessor)
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
                Title = model.Title,
                Description = model.Description,
                Town = model.Town,
                Price = model.Price,
                EndDate = model.EndDate,
                StartDate = model.StartDate,
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
                IsTrue = true,
                Title = model.Title,
                Description = model.Description,
                Price = model.Price,
                EndDate = model.EndDate,
                StartDate = model.StartDate,
                ServiceType = model.ServiceType,
                Xcordinates = model.Xcordinates,
                Ycordinates = model.Ycordinates,
                Town = model.Town,
                Erors = new List<string>()
            };

        }

        public async Task<int> DeleteAdAsync(string id)
        {
            var ad = context.Ads.FirstOrDefault(a => a.Id == id);

            if(ad==null)
            {
                throw new ArgumentNullException();
            }
            context.Ads.Remove(ad);
            await context.SaveChangesAsync();

            return 1;
        }

        public async Task<AdResponseModel> GetAdByIdAsync(string id)
        {
            var ad = await context.Ads.FirstOrDefaultAsync(a => a.Id == id);

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
            var ads = await context.Ads.Select(a=>new AdResponseModel()
            {
                Title = a.Title,
                Description=a.Description,
                EndDate = a.EndDate,
                StartDate = a.StartDate,
                Price = a.Price,
                IsTrue =true,
                ServiceType = a.TypeService,
                Xcordinates = a.Xcordinates,
                Ycordinates = a.Ycordinates,
                Town = a.Town
            }).ToListAsync();

            if (ads.Count == 0)
            {
                throw new ArgumentNullException();
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
        private string GetCurrentUserId()
        {
            return httpContextAccessor
                .HttpContext?
                .User?
                .FindFirstValue(ClaimTypes.NameIdentifier);
        }
    }
}
