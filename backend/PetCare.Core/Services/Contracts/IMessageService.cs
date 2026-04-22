using PetCare.Core.Models;

namespace PetCare.Core.Services.Contracts
{
    /// <summary>
    /// Abstraction over the private messaging feature.
    /// Implementations resolve the current user from the HTTP context and
    /// enforce recipient existence.
    /// </summary>
    public interface IMessageService
    {
        /// <summary>
        /// Sends a new message from the current user to the recipient identified by
        /// <see cref="SendMessageRequest.RecipientEmail"/>.
        /// </summary>
        /// <param name="request">Recipient, subject and body of the message.</param>
        /// <returns>The persisted message as a response DTO.</returns>
        Task<MessageResponseModel> SendMessageAsync(SendMessageRequest request);

        /// <summary>Returns messages received by the current user, newest first.</summary>
        Task<List<MessageResponseModel>> GetInboxAsync();

        /// <summary>Returns messages sent by the current user, newest first.</summary>
        Task<List<MessageResponseModel>> GetSentAsync();

        /// <summary>Marks a received message as read. No-op if the message is already read or not owned by the caller.</summary>
        /// <param name="messageId">Identifier of the message to mark.</param>
        Task MarkAsReadAsync(string messageId);

        /// <summary>Returns the number of unread messages addressed to the current user.</summary>
        Task<int> GetUnreadCountAsync();
    }
}
