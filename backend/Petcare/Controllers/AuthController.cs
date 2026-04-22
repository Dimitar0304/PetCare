using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.Data;
using Microsoft.AspNetCore.Mvc;
using PetCare.Core.Models;
using PetCare.Core.Services.Contracts;
using PetCare.Infrastructure.Data.Models;

namespace Petcare.Controllers;

/// <summary>
/// Authentication endpoints under <c>/api/Auth</c>. Issues JWT access tokens on
/// successful login/register and exposes a best-effort logout hook for clients.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public sealed class AuthController(
    UserManager<User> manager,
    SignInManager<User> signInManager,
    IJwtService service) : ControllerBase
{
    private const string InvalidCredentials = "Invalid email or password";

    /// <summary>Authenticates a user by email and password and returns a JWT token on success.</summary>
    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest model)
    {
        var user = await manager.FindByEmailAsync(model.Email);
        if (user is null) return Unauthorized(InvalidCredentials);

        var result = await signInManager.CheckPasswordSignInAsync(user, model.Password, lockoutOnFailure: false);
        if (!result.Succeeded) return Unauthorized(InvalidCredentials);

        return Ok(BuildAuthResponse(user));
    }

    /// <summary>Registers a new user account and issues an initial JWT token.</summary>
    [AllowAnonymous]
    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterUserRequest model)
    {
        var user = new User
        {
            Email = model.Email,
            PhoneNumber = model.Phone,
            FirstName = model.FirstName,
            LastName = model.LastName,
            PasswordHash = model.Password,
            UserName = model.UserName,
            Role = MapRole(model.Role),
        };

        var result = await manager.CreateAsync(user, model.Password);
        if (!result.Succeeded)
        {
            return BadRequest(new AuthResponse
            {
                Errors = new List<string> { "Invalid credentials!" }
            });
        }

        return Ok(BuildAuthResponse(user));
    }

    /// <summary>
    /// Stateless logout hook. Token invalidation is handled client-side (the JWT is
    /// simply discarded); this endpoint exists so clients can confirm the session
    /// termination succeeded server-side as well.
    /// </summary>
    [Authorize]
    [HttpPost("logout")]
    public IActionResult Logout() =>
        Ok(new { messsage = "Logged out successfully" });

    private AuthResponse BuildAuthResponse(User user) => new()
    {
        Token = service.GenerateToken(user),
        IsAuthenticated = true,
        UserId = user.Id,
    };

    private static int MapRole(string? role) => role switch
    {
        "Petcarer" => 1,
        "PetOwner" => 2,
        _ => 0,
    };
}
