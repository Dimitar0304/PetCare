using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PetCare.Core.Models;
using PetCare.Core.Services.Contracts;

namespace Petcare.Controllers;

/// <summary>
/// Endpoints for the private messaging feature under <c>/api/Message</c>.
/// All endpoints require authentication.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public sealed class MessageController(IMessageService messageService) : ControllerBase
{
    /// <summary>Sends a new message to the recipient identified by email.</summary>
    [HttpPost("send")]
    public async Task<IActionResult> Send([FromBody] SendMessageRequest request)
    {
        try
        {
            return Ok(await messageService.SendMessageAsync(request));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>Returns the current user's inbox, newest first.</summary>
    [HttpGet("inbox")]
    public async Task<ActionResult<List<MessageResponseModel>>> GetInbox() =>
        Ok(await messageService.GetInboxAsync());

    /// <summary>Returns the messages the current user has sent, newest first.</summary>
    [HttpGet("sent")]
    public async Task<ActionResult<List<MessageResponseModel>>> GetSent() =>
        Ok(await messageService.GetSentAsync());

    /// <summary>Marks a message as read. No-op when the message does not exist or is not addressed to the current user.</summary>
    [HttpPost("read/{id}")]
    public async Task<IActionResult> MarkAsRead(string id)
    {
        await messageService.MarkAsReadAsync(id);
        return Ok();
    }

    /// <summary>Returns the number of unread messages for the current user.</summary>
    [HttpGet("unread-count")]
    public async Task<IActionResult> GetUnreadCount() =>
        Ok(new { count = await messageService.GetUnreadCountAsync() });
}
