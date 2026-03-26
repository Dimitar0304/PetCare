using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using PetCare.Core.Services.Contracts;
using PetCare.Infrastructure.Data.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace PetCare.Core.Services.JWT
{
    public class JWTService : IJwtService
    {
        private readonly IConfiguration configuration;

        public JWTService(IConfiguration _config)
        {
            configuration = _config;
        }
        public string GenerateToken(User user)
        {
            var roleLabel = user.Role switch
            {
                2 => "Seeker", // PetOwner
                1 => "Provider", // Petcarer
                _ => "Provider"
            };

            var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(ClaimTypes.Email, user.Email),
            // Keep a simple claim key for the Angular frontend.
            new Claim("role", roleLabel),
            // Also include the standard claim type for compatibility with JWT decoders.
            new Claim(ClaimTypes.Role, roleLabel)
        };

            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(configuration["Jwt:Key"])
            );

            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: configuration["Jwt:Issuer"],
                audience: configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddDays(7),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
