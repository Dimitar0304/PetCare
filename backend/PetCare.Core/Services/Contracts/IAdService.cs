using PetCare.Core.Models;

namespace PetCare.Core.Services.Contracts
{
    /// <summary>
    /// Abstraction over the advertisement domain. Implementations own validation,
    /// authorization of ownership-sensitive operations, and persistence.
    /// </summary>
    public interface IAdService
    {
        /// <summary>
        /// Creates a new advertisement for the currently authenticated user.
        /// </summary>
        /// <param name="model">Data supplied by the client.</param>
        /// <returns>
        /// An <see cref="AdResponseModel"/> representing the saved advertisement on success,
        /// or one whose <c>IsTrue</c> is false with validation errors populated.
        /// </returns>
        public Task<AdResponseModel> CreateAnAdAsync(AdRequestModel model);

        /// <summary>
        /// Deletes an advertisement owned by the current user.
        /// </summary>
        /// <param name="adId">Identifier of the advertisement to delete.</param>
        /// <returns>
        /// 1 on successful deletion, 0 when the ad is not found or is not owned by the caller.
        /// </returns>
        public Task<int> DeleteAdAsync(string adId);

        /// <summary>
        /// Updates an existing advertisement owned by the current user.
        /// </summary>
        /// <param name="adId">Identifier of the advertisement to update.</param>
        /// <param name="model">New values for the advertisement.</param>
        /// <returns>
        /// The updated advertisement on success, or a response with <c>IsTrue = false</c> and errors
        /// when validation fails or the caller is not the owner.
        /// </returns>
        public Task<AdResponseModel> UpdateAdAsync(string adId, AdRequestModel model);

        /// <summary>Retrieves a single advertisement by its identifier.</summary>
        /// <param name="id">Identifier of the advertisement.</param>
        public Task<AdResponseModel> GetAdByIdAsync(string id);

        /// <summary>Retrieves all advertisements. Intended for small datasets or admin use.</summary>
        public Task<List<AdResponseModel>> GetAllAdsAsync();

        /// <summary>
        /// Retrieves a single page of advertisements ordered by most recent first.
        /// </summary>
        /// <param name="page">1-based page number.</param>
        /// <param name="pageSize">Maximum number of items per page.</param>
        public Task<PagedResult<AdResponseModel>> GetAdsPageAsync(int page, int pageSize);
    }
}
