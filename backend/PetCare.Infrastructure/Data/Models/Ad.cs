using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PetCare.Infrastructure.Data.Models
{
    /// <summary>
    /// Entity representing a pet-care advertisement published by a service provider.
    /// Persisted in the <c>Ads</c> table and navigated from <see cref="User.Ads"/>.
    /// </summary>
    public class Ad
    {
        /// <summary>Primary key of the advertisement (GUID string).</summary>
        [Key]
        public string Id { get; set; } = null!;

        /// <summary>Short title shown in listings and search results.</summary>
        public string Title { get; set; } = null!;

        /// <summary>Free-text description of the offered service.</summary>
        public string Description { get; set; } = null!;

        /// <summary>Category describing the type of service offered.</summary>
        public AdServiceType TypeService { get; set; }

        /// <summary>Town or city where the service is provided.</summary>
        public string Town { get; set; } = null!;

        /// <summary>Optional latitude coordinate of the service location.</summary>
        public string? Xcordinates { get; set; } = null!;

        /// <summary>Optional longitude coordinate of the service location.</summary>
        public string? Ycordinates { get; set; } = null!;

        /// <summary>Price of the advertised service.</summary>
        public decimal Price { get; set; }

        /// <summary>UTC timestamp at which the advertisement was created.</summary>
        public DateTime CreatedOn { get; set; } = DateTime.UtcNow;

        /// <summary>Optional start date of the service's availability window.</summary>
        public DateTime? StartDate { get; set; }

        /// <summary>Optional end date of the service's availability window.</summary>
        public DateTime? EndDate { get; set; }

        /// <summary>Foreign key referencing the owning user.</summary>
        [ForeignKey(nameof(User))]
        public string OwnerId { get; set; } = null!;

        /// <summary>Navigation property to the user who owns the advertisement.</summary>
        public User Owner { get; set; } = null!;
    }
}
