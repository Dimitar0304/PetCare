using System.ComponentModel.DataAnnotations;

namespace PetCare.Infrastructure.Data.Models
{
    public class Message
    {
        [Key]
        public string Id { get; set; } = null!;

        public string SenderId { get; set; } = null!;
        public string SenderEmail { get; set; } = null!;

        public string RecipientEmail { get; set; } = null!;
        public string? RecipientId { get; set; }

        public string Subject { get; set; } = null!;
        public string Body { get; set; } = null!;

        public DateTime SentAt { get; set; } = DateTime.UtcNow;
        public bool IsRead { get; set; } = false;
    }
}
