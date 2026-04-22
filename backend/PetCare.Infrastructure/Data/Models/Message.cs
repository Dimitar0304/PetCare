using System.ComponentModel.DataAnnotations;

namespace PetCare.Infrastructure.Data.Models
{
    /// <summary>
    /// Entity representing a private message exchanged between two users.
    /// </summary>
    public class Message
    {
        /// <summary>Primary key of the message (GUID string).</summary>
        [Key]
        public string Id { get; set; } = null!;

        /// <summary>Identifier of the sending user.</summary>
        public string SenderId { get; set; } = null!;

        /// <summary>Denormalized email of the sender, kept for historical accuracy if the user is removed.</summary>
        public string SenderEmail { get; set; } = null!;

        /// <summary>Email used to address the message; resolved to an existing user on send.</summary>
        public string RecipientEmail { get; set; } = null!;

        /// <summary>
        /// Identifier of the recipient user, resolved from <see cref="RecipientEmail"/>.
        /// Null when the email does not correspond to a registered account.
        /// </summary>
        public string? RecipientId { get; set; }

        /// <summary>Subject line of the message.</summary>
        public string Subject { get; set; } = null!;

        /// <summary>Message body content.</summary>
        public string Body { get; set; } = null!;

        /// <summary>UTC timestamp at which the message was sent.</summary>
        public DateTime SentAt { get; set; } = DateTime.UtcNow;

        /// <summary>Indicates whether the recipient has opened the message.</summary>
        public bool IsRead { get; set; } = false;
    }
}
