using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PetCare.Core.Models;
using PetCare.Core.Services.Contracts;
using System.DirectoryServices.Protocols;

namespace Petcare.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AdController:ControllerBase
    {
        private readonly IAdService service;

        public AdController(IAdService _service)
        {
            service = _service;
        }
        [AllowAnonymous]
       
        public async Task<ActionResult<List<AddResponse>>>Get()
        {
            var ads = await service.GetAllAdsAsync();

            return Ok(ads);
        }
        [HttpPost("create")]
        public async Task<IActionResult> CreateAd([FromBody] AdRequestModel model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var result = await service.CreateAnAdAsync(model);
            if (!result.IsTrue)
            {
                return BadRequest();
            }
            return Ok(result);
        }
    }
}
