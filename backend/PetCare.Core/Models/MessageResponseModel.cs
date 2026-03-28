namespace PetCare.Core.Models
{
    public class MessageResponseModel
    {
        public string Id { get; set; } = null!;
        public string SenderId { get; set; } = null!;
        public string SenderEmail { get; set; } = null!;
        public string RecipientEmail { get; set; } = null!;
        public string Subject { get; set; } = null!;
        public string Body { get; set; } = null!;
        public DateTime SentAt { get; set; }
        public bool IsRead { get; set; }
    }
}
