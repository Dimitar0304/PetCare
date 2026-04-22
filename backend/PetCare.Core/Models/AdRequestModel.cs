using PetCare.Infrastructure.Data.Models;

namespace PetCare.Core.Models
{
    /// <summary>
    /// Data transfer object used when creating or updating a pet-care advertisement.
    /// </summary>
    public class AdRequestModel
    {
        /// <summary>Short, human-readable title of the advertisement.</summary>
        public string Title { get; set; } = null!;

        /// <summary>Free-text description of the offered service.</summary>
        public string Description { get; set; } = null!;

        /// <summary>Category of service being advertised (e.g. walking, sitting, grooming).</summary>
        public AdServiceType ServiceType { get; set; }

        /// <summary>Name of the town or city in which the service is offered.</summary>
        public string Town { get; set; } = null!;

        /// <summary>Optional latitude of the service location, stored as a string for flexibility.</summary>
        public string? Xcordinates { get; set; } = null!;

        /// <summary>Optional longitude of the service location, stored as a string for flexibility.</summary>
        public string? Ycordinates { get; set; } = null!;

        /// <summary>Price for the advertised service in the application's base currency.</summary>
        public decimal Price { get; set; }

        /// <summary>Optional start date of the service's availability window.</summary>
        public DateTime? StartDate { get; set; }

        /// <summary>Optional end date of the service's availability window.</summary>
        public DateTime? EndDate { get; set; }
    }
}
