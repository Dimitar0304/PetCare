using PetCare.Core.Models;
using PetCare.Core.Services.Contracts;
using PetCare.Infrastructure.Data;

namespace PetCare.Core.Services.Ad
{
    public class AdService : IAdService
    {
        private PetcareDbContext context;
        public AdService(PetcareDbContext _context)
        {
            context = _context;
        }
        public Task<AdResponseModel> CreateAnAdAsync(AdRequestModel model)
        {
            throw new NotImplementedException();
        }

        public Task<int> DeleteAdAsync()
        {
            throw new NotImplementedException();
        }

        public Task<AdResponseModel> GetAdByIdAsync(string id)
        {
            throw new NotImplementedException();
        }

        public Task<List<AdResponseModel>> GetAllAdsAsync()
        {
            throw new NotImplementedException();
        }

        public Task<AdResponseModel> UpdateAdAsync(AdRequestModel model)
        {
            throw new NotImplementedException();
        }
    }
}
