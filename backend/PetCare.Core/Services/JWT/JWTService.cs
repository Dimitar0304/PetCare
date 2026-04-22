using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using PetCare.Core.Services.Contracts;
using PetCare.Infrastructure.Data.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace PetCare.Core.Services.JWT;

/// <summary>
/// HMAC-SHA256 signed JWT issuer used by the authentication endpoints.
/// Reads issuer, audience and signing key from the <c>Jwt</c> configuration section.
/// </summary>
public sealed class JWTService(IConfiguration configuration) : IJwtService
{
    private static readonly TimeSpan TokenLifetime = TimeSpan.FromDays(7);

    /// <summary>
    /// Produces a HMAC-SHA256 signed JWT for the given user. The numeric
    /// <see cref="User.Role"/> is mapped to a readable label (Seeker / Provider / Admin)
    /// and emitted under both the short <c>role</c> claim (consumed by the Angular client)
    /// and the standard <see cref="ClaimTypes.Role"/> claim (consumed by ASP.NET authorization).
    /// </summary>
    public string GenerateToken(User user)
    {
        var roleLabel = MapRole(user.Role);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id),
            new(ClaimTypes.Email, user.Email),
            new("role", roleLabel),
            new(ClaimTypes.Role, roleLabel),
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(configuration["Jwt:Key"]!));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: configuration["Jwt:Issuer"],
            audience: configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.Add(TokenLifetime),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    /// <summary>Maps the internal numeric role to the label consumed by clients and authorization policies.</summary>
    private static string MapRole(int role) => role switch
    {
        1 => "Provider",
        2 => "Seeker",
        3 => "Admin",
        _ => "Provider",
    };
}
