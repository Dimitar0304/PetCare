using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using PetCare.Core.Models;
using PetCare.Core.Services.Contracts;
using PetCare.Infrastructure.Data;
using PetCare.Infrastructure.Data.Models;
using System.Security.Claims;

namespace PetCare.Core.Services.Messages
{
    public class MessageService : IMessageService
    {
        private readonly PetcareDbContext context;
        private readonly IHttpContextAccessor httpContextAccessor;
        private readonly UserManager<User> userManager;

        public MessageService(
            PetcareDbContext context,
            IHttpContextAccessor httpContextAccessor,
            UserManager<User> userManager)
        {
            this.context = context;
            this.httpContextAccessor = httpContextAccessor;
            this.userManager = userManager;
        }

        public async Task<MessageResponseModel> SendMessageAsync(SendMessageRequest request)
        {
            var senderId = GetCurrentUserId() ?? throw new UnauthorizedAccessException();
            var senderEmail = GetCurrentUserEmail() ?? throw new UnauthorizedAccessException();

            var recipient = await userManager.FindByEmailAsync(request.RecipientEmail);
            if (recipient == null)
                throw new InvalidOperationException($"No user found with email '{request.RecipientEmail}'.");

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
                IsRead = false
            };

            await context.Messages.AddAsync(message);
            await context.SaveChangesAsync();

            return MapToModel(message);
        }

        public async Task<List<MessageResponseModel>> GetInboxAsync()
        {
            var userId = GetCurrentUserId() ?? throw new UnauthorizedAccessException();

            return await context.Messages
                .AsNoTracking()
                .Where(m => m.RecipientId == userId)
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
                    IsRead = m.IsRead
                })
                .ToListAsync();
        }

        public async Task<List<MessageResponseModel>> GetSentAsync()
        {
            var userId = GetCurrentUserId() ?? throw new UnauthorizedAccessException();

            return await context.Messages
                .AsNoTracking()
                .Where(m => m.SenderId == userId)
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
                    IsRead = m.IsRead
                })
                .ToListAsync();
        }

        public async Task MarkAsReadAsync(string messageId)
        {
            var userId = GetCurrentUserId() ?? throw new UnauthorizedAccessException();

            var message = await context.Messages
                .FirstOrDefaultAsync(m => m.Id == messageId && m.RecipientId == userId);

            if (message == null) return;

            message.IsRead = true;
            await context.SaveChangesAsync();
        }

        public async Task<int> GetUnreadCountAsync()
        {
            var userId = GetCurrentUserId();
            if (userId == null) return 0;

            return await context.Messages
                .CountAsync(m => m.RecipientId == userId && !m.IsRead);
        }

        private string? GetCurrentUserId()
        {
            var user = httpContextAccessor.HttpContext?.User;
            if (user == null) return null;
            return user.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? user.FindFirstValue("nameid")
                ?? user.FindFirstValue("sub");
        }

        private string? GetCurrentUserEmail()
        {
            var user = httpContextAccessor.HttpContext?.User;
            if (user == null) return null;
            return user.FindFirstValue(ClaimTypes.Email)
                ?? user.FindFirstValue("email");
        }

        private static MessageResponseModel MapToModel(Message m) => new()
        {
            Id = m.Id,
            SenderId = m.SenderId,
            SenderEmail = m.SenderEmail,
            RecipientEmail = m.RecipientEmail,
            Subject = m.Subject,
            Body = m.Body,
            SentAt = m.SentAt,
            IsRead = m.IsRead
        };
    }
}
