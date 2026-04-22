namespace PetCare.Core.Models
{
    /// <summary>
    /// Representation of a private message returned to clients in inbox and sent-message listings.
    /// </summary>
    public class MessageResponseModel
    {
        /// <summary>Unique identifier of the message.</summary>
        public string Id { get; set; } = null!;

        /// <summary>Identifier of the user who sent the message.</summary>
        public string SenderId { get; set; } = null!;

        /// <summary>Email address of the sender.</summary>
        public string SenderEmail { get; set; } = null!;

        /// <summary>Email address of the recipient.</summary>
        public string RecipientEmail { get; set; } = null!;

        /// <summary>Subject line of the message.</summary>
        public string Subject { get; set; } = null!;

        /// <summary>Message body content.</summary>
        public string Body { get; set; } = null!;

        /// <summary>UTC timestamp at which the message was sent.</summary>
        public DateTime SentAt { get; set; }

        /// <summary>Indicates whether the recipient has opened the message.</summary>
        public bool IsRead { get; set; }
    }
}
