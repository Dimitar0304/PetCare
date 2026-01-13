using PetCare.Core.Models;

namespace PetCare.Core.Services.Contracts
{
    public interface IAdService
    {
        public Task<AdResponseModel> CreateAnAdAsync(AdRequestModel model);

        public Task<int> DeleteAdAsync(string adId);

        public Task UpdateAdAsync(AdRequestModel model,string adId);

        public Task<AdResponseModel> GetAdByIdAsync(string id);

        public Task<List<AdResponseModel>> GetAllAdsAsync();
    }
}
