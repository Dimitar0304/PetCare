using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PetCare.Core.Models;
using PetCare.Core.Services.Contracts;
using System.DirectoryServices.Protocols;
using System.Threading.Tasks;

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
        [HttpGet("getAll")]
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

        [HttpPost("update")]
        public async Task<IActionResult> UpdateAd([FromBody] AdRequestModel model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            string adId = service.GetAllAdsAsync()
                .Result.Where(c => c.Title == model.Title && c.Description == model.Description)
                .FirstOrDefault().Id;

            var result = service.UpdateAdAsync(model, adId);

            if (!result.IsCompleted)
            {
                return BadRequest();
            }

            return Ok(result);
        }

        [HttpPost("delete")]
        public IActionResult DeleteAdById(string id)
        {
            if (id == null)
            {
                return BadRequest();
            }

            var result = service.DeleteAdAsync(id);

            if (!result.IsCompleted)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }
        [HttpGet("getById")]
        [AllowAnonymous]
        public async Task<IActionResult> GetByIdAsync(string id)
        {
            if (id == null)
            {
                return BadRequest();
            }

            var result = await service.GetAdByIdAsync(id);

            if (result == null)
            {
                return BadRequest();
            }

            return Ok(result);
        }
    }
}
