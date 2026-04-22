using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;

namespace PetCare.Infrastructure.Data.Models
{
    /// <summary>
    /// Application user entity that extends ASP.NET Core Identity's <see cref="IdentityUser"/>
    /// with profile fields (first/last name, role, registration date) and the collection of
    /// advertisements the user owns.
    /// </summary>
    public class User : IdentityUser
    {
        /// <summary>Primary key of the user (GUID string), inherited from <see cref="IdentityUser"/>.</summary>
        [Key]
        public override string Id { get => base.Id; set => base.Id = value; }

        /// <summary>Legal first name of the user.</summary>
        public string FirstName { get; set; } = null!;

        /// <summary>Legal last name of the user.</summary>
        public string LastName { get; set; } = null!;

        /// <summary>Contact phone number. Overrides the base Identity property to make it required.</summary>
        public override string PhoneNumber { get; set; } = null!;

        /// <summary>
        /// Role identifier of the user. Encoded as an integer to map to application-level
        /// role enumerations (e.g. seeker, provider, admin).
        /// </summary>
        public int Role { get; set; }

        /// <summary>Email address, used as the primary login identifier.</summary>
        public override string? Email { get => base.Email; set => base.Email = value; }

        /// <summary>UTC timestamp at which the user account was created.</summary>
        public DateTime RegisteredOn { get; set; } = DateTime.UtcNow;

        /// <summary>Navigation property listing all advertisements owned by the user.</summary>
        public List<Ad> Ads { get; set; } = new List<Ad>();
    }
}
