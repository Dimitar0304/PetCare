using PetCare.Infrastructure.Data.Models;

namespace PetCare.Core.Services.Contracts
{
    public interface IJwtService
    {
       public string GenerateToken(User user);
    }
}
