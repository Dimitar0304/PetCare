namespace PetCare.Core.Models
{
    /// <summary>
    /// Payload supplied by the client when creating a new user account.
    /// </summary>
    public class RegisterUserRequest
    {
        /// <summary>Legal first name of the user.</summary>
        public string FirstName { get; set; } = null!;

        /// <summary>Legal last name of the user.</summary>
        public string LastName { get; set; } = null!;

        /// <summary>Email address, used as the primary login identifier.</summary>
        public string Email { get; set; } = null!;

        /// <summary>Contact phone number.</summary>
        public string Phone { get; set; } = null!;

        /// <summary>Plain-text password; hashed before being persisted.</summary>
        public string Password { get; set; } = null!;

        /// <summary>Role requested for the new account (e.g. "Seeker" or "Provider").</summary>
        public string Role { get; set; } = null!;

        /// <summary>Display user name chosen for the account.</summary>
        public string UserName { get; set; } = null!;
    }
}
