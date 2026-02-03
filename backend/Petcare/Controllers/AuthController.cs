using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.Data;
using Microsoft.AspNetCore.Mvc;
using PetCare.Core.Models;
using PetCare.Core.Services.Contracts;
using PetCare.Infrastructure.Data.Models;

namespace Petcare.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<User> manager;
        private readonly SignInManager<User> signInManager;
        private readonly IJwtService service;

        public AuthController(UserManager<User> _manager,SignInManager<User>_signInManager,
            IJwtService _service)
        {
            manager = _manager;
            signInManager = _signInManager;
            service = _service;
        }
        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginRequest model)
        {
            var user = await manager.FindByEmailAsync(model.Email);

            if (user == null)
            {
                return Unauthorized("Invalid email or password");
            }

            var result =await signInManager.CheckPasswordSignInAsync(user, model.Password,false);

            if(!result.Succeeded)
            {
                return Unauthorized("Invalid email or password");
            }

            var token = service.GenerateToken(user);

            return Ok(new AuthResponse()
            {
                Token = token,
                IsAuthenticated = true,
                UserId = user.Id
            });
        }
        [AllowAnonymous]
        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterUserRequest model)
        {
            var user = new User()
            {
                Email = model.Email,
                PhoneNumber = model.Phone,
                FirstName = model.FirstName,
                LastName = model.LastName,
                PasswordHash = model.Password,
                UserName =model.UserName
            };
            if (model.Role == "Petcarer")
            {
                user.Role = 1;
            }
            else if (model.Role == "PetOwner")
            {
                user.Role = 2;
            }
            var result = await manager.CreateAsync(user, model.Password);

            if (!result.Succeeded)
            {
                return BadRequest(new AuthResponse()
                {
                    Errors = new List<string>()
                    {
                        "Invalid credentials!"
                    }
                });
            }
            return Ok(new AuthResponse()
            {
                IsAuthenticated = true,
                UserId = user.Id,
                Token = service.GenerateToken(user)
            });
        }

        [Authorize]
        [HttpPost("logout")]
        public IActionResult Logout()
        {
            return Ok(new { messsage = "Logged out successfully" });
        }
    }
}
