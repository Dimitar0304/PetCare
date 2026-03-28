using PetCare.Core.Models;

namespace PetCare.Core.Services.Contracts
{
    public interface IMessageService
    {
        Task<MessageResponseModel> SendMessageAsync(SendMessageRequest request);
        Task<List<MessageResponseModel>> GetInboxAsync();
        Task<List<MessageResponseModel>> GetSentAsync();
        Task MarkAsReadAsync(string messageId);
        Task<int> GetUnreadCountAsync();
    }
}
