using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;

namespace PetCare.Infrastructure.Data.Models
{
    public class User:IdentityUser
    {
        [Key]
        public override string Id { get => base.Id; set => base.Id = value; }
        public string FirstName { get; set; } = null!;

        public string LastName { get; set; } = null!;

        public override string PhoneNumber { get; set; } = null!;

        public int Role { get; set; }
        public override string? Email { get => base.Email; set => base.Email = value; }

        public DateTime RegisteredOn { get; set; } = DateTime.UtcNow;
        public List<Ad> Ads { get; set; } = new List<Ad>();
    }
}
