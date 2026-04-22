namespace PetCare.Core.Models
{
    /// <summary>
    /// Payload used when a signed-in user sends a new private message to another user.
    /// </summary>
    public class SendMessageRequest
    {
        /// <summary>Email address of the recipient. Must correspond to an existing user.</summary>
        public string RecipientEmail { get; set; } = null!;

        /// <summary>Subject line of the message.</summary>
        public string Subject { get; set; } = null!;

        /// <summary>Message body content.</summary>
        public string Body { get; set; } = null!;
    }
}
