using PetCare.Infrastructure.Data.Models;

namespace PetCare.Core.Services.Contracts
{
    /// <summary>
    /// Abstraction over JSON Web Token issuance for authenticated users.
    /// </summary>
    public interface IJwtService
    {
        /// <summary>
        /// Produces a signed JWT access token for the given user, embedding identity and role claims
        /// consumed by the API's authorization pipeline.
        /// </summary>
        /// <param name="user">User for which to issue a token.</param>
        /// <returns>Signed, URL-safe JWT string ready to be returned to the client.</returns>
        public string GenerateToken(User user);
    }
}
