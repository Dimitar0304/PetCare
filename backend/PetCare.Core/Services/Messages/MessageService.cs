using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using PetCare.Core.Models;
using PetCare.Core.Services.Contracts;
using PetCare.Infrastructure.Data;
using PetCare.Infrastructure.Data.Models;
using System.Security.Claims;

namespace PetCare.Core.Services.Messages;

/// <summary>
/// EF Core-backed implementation of <see cref="IMessageService"/>.
/// Resolves the current user from the HTTP context, persists messages,
/// and triggers a best-effort email notification to the recipient.
/// </summary>
public sealed class MessageService(
    PetcareDbContext context,
    IHttpContextAccessor httpContextAccessor,
    UserManager<User> userManager,
    IEmailSender emailSender) : IMessageService
{
    /// <summary>
    /// Persists a new message from the current user to the recipient identified by email,
    /// then fires off a best-effort email notification. SMTP failures are swallowed so the
    /// API call still succeeds.
    /// </summary>
    public async Task<MessageResponseModel> SendMessageAsync(SendMessageRequest request)
    {
        var senderId = GetCurrentUserId() ?? throw new UnauthorizedAccessException();
        var senderEmail = GetCurrentUserEmail() ?? throw new UnauthorizedAccessException();

        var recipient = await userManager.FindByEmailAsync(request.RecipientEmail)
            ?? throw new InvalidOperationException($"No user found with email '{request.RecipientEmail}'.");

        var message = new Message
        {
            Id = Guid.NewGuid().ToString(),
            SenderId = senderId,
            SenderEmail = senderEmail,
            RecipientEmail = request.RecipientEmail,
            RecipientId = recipient.Id,
            Subject = request.Subject,
            Body = request.Body,
            SentAt = DateTime.UtcNow,
            IsRead = false,
        };

        await context.Messages.AddAsync(message);
        await context.SaveChangesAsync();

        await TryNotifyRecipientAsync(message);

        return ToModel(message);
    }

    /// <summary>Returns the current user's received messages, newest first.</summary>
    public Task<List<MessageResponseModel>> GetInboxAsync()
    {
        var userId = GetCurrentUserId() ?? throw new UnauthorizedAccessException();
        return QueryMessages(m => m.RecipientId == userId).ToListAsync();
    }

    /// <summary>Returns the messages the current user has sent, newest first.</summary>
    public Task<List<MessageResponseModel>> GetSentAsync()
    {
        var userId = GetCurrentUserId() ?? throw new UnauthorizedAccessException();
        return QueryMessages(m => m.SenderId == userId).ToListAsync();
    }

    /// <summary>Marks a message as read when it belongs to the current user's inbox.</summary>
    public async Task MarkAsReadAsync(string messageId)
    {
        var userId = GetCurrentUserId() ?? throw new UnauthorizedAccessException();

        var message = await context.Messages
            .FirstOrDefaultAsync(m => m.Id == messageId && m.RecipientId == userId);

        if (message is null) return;

        message.IsRead = true;
        await context.SaveChangesAsync();
    }

    /// <summary>Counts unread messages addressed to the current user. Returns 0 for anonymous callers.</summary>
    public async Task<int> GetUnreadCountAsync()
    {
        var userId = GetCurrentUserId();
        if (userId is null) return 0;

        return await context.Messages.CountAsync(m => m.RecipientId == userId && !m.IsRead);
    }

    /// <summary>Fires an SMTP notification; any failure is intentionally swallowed.</summary>
    private async Task TryNotifyRecipientAsync(Message message)
    {
        try
        {
            var subject = $"Petcare: {message.Subject}";
            var body = $"You received a new message from {message.SenderEmail}:\n\n{message.Body}\n\n---\nPetcare";
            await emailSender.SendAsync(message.RecipientEmail, subject, body);
        }
        catch
        {
            // Intentionally ignored: notifications are best-effort.
        }
    }

    /// <summary>Shared projection with ordering, used by both inbox and sent queries.</summary>
    private IQueryable<MessageResponseModel> QueryMessages(
        System.Linq.Expressions.Expression<Func<Message, bool>> predicate) =>
        context.Messages
            .AsNoTracking()
            .Where(predicate)
            .OrderByDescending(m => m.SentAt)
            .Select(m => new MessageResponseModel
            {
                Id = m.Id,
                SenderId = m.SenderId,
                SenderEmail = m.SenderEmail,
                RecipientEmail = m.RecipientEmail,
                Subject = m.Subject,
                Body = m.Body,
                SentAt = m.SentAt,
                IsRead = m.IsRead,
            });

    private string? GetCurrentUserId() =>
        GetClaim(ClaimTypes.NameIdentifier, "nameid", "sub");

    private string? GetCurrentUserEmail() =>
        GetClaim(ClaimTypes.Email, "email");

    private string? GetClaim(params string[] names)
    {
        var user = httpContextAccessor.HttpContext?.User;
        if (user is null) return null;

        foreach (var name in names)
        {
            var value = user.FindFirstValue(name);
            if (!string.IsNullOrEmpty(value)) return value;
        }
        return null;
    }

    private static MessageResponseModel ToModel(Message m) => new()
    {
        Id = m.Id,
        SenderId = m.SenderId,
        SenderEmail = m.SenderEmail,
        RecipientEmail = m.RecipientEmail,
        Subject = m.Subject,
        Body = m.Body,
        SentAt = m.SentAt,
        IsRead = m.IsRead,
    };
}
