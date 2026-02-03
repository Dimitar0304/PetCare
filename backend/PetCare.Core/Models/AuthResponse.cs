namespace PetCare.Core.Models
{
    public class AuthResponse
    {
        public bool IsAuthenticated { get; set; }
        public string Token { get; set; } = null!;
        public string UserId { get; set; } = null!;
        public List<string> Errors { get; set; } = new List<string>();
    }
}
