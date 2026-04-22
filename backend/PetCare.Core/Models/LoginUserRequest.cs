namespace PetCare.Core
{
    /// <summary>
    /// Credentials supplied by a client attempting to authenticate via the login endpoint.
    /// </summary>
    public class LoginUserRequest
    {
        /// <summary>Email address used as the login identifier.</summary>
        public string Email { get; set; } = null!;

        /// <summary>Plain-text password, validated against the stored password hash.</summary>
        public string Password { get; set; } = null!;
    }
}
