using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PetCare.Core.Models;
using PetCare.Core.Services.Contracts;

namespace Petcare.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class MessageController : ControllerBase
    {
        private readonly IMessageService messageService;

        public MessageController(IMessageService messageService)
        {
            this.messageService = messageService;
        }

        [HttpPost("send")]
        public async Task<IActionResult> Send([FromBody] SendMessageRequest request)
        {
            try
            {
                var result = await messageService.SendMessageAsync(request);
                return Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpGet("inbox")]
        public async Task<IActionResult> GetInbox()
        {
            var messages = await messageService.GetInboxAsync();
            return Ok(messages);
        }

        [HttpGet("sent")]
        public async Task<IActionResult> GetSent()
        {
            var messages = await messageService.GetSentAsync();
            return Ok(messages);
        }

        [HttpPost("read/{id}")]
        public async Task<IActionResult> MarkAsRead(string id)
        {
            await messageService.MarkAsReadAsync(id);
            return Ok();
        }

        [HttpGet("unread-count")]
        public async Task<IActionResult> GetUnreadCount()
        {
            var count = await messageService.GetUnreadCountAsync();
            return Ok(new { count });
        }
    }
}
