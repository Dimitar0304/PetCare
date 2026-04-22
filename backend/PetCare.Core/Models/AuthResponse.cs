namespace PetCare.Core.Models
{
    /// <summary>
    /// Response returned by authentication operations such as login and registration.
    /// </summary>
    public class AuthResponse
    {
        /// <summary>True if the request resulted in a valid authenticated session.</summary>
        public bool IsAuthenticated { get; set; }

        /// <summary>Signed JWT access token issued to the client. Empty when authentication fails.</summary>
        public string Token { get; set; } = null!;

        /// <summary>Identifier of the authenticated user.</summary>
        public string UserId { get; set; } = null!;

        /// <summary>Validation or authentication errors that prevented issuing a token.</summary>
        public List<string> Errors { get; set; } = new List<string>();
    }
}
