namespace PetCare.Core.Models
{
    public class SendMessageRequest
    {
        public string RecipientEmail { get; set; } = null!;
        public string Subject { get; set; } = null!;
        public string Body { get; set; } = null!;
    }
}
