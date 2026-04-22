using PetCare.Infrastructure.Data.Models;

namespace PetCare.Core.Models
{
    /// <summary>
    /// Response payload returned by ad-related endpoints. Combines the advertisement
    /// data with an operation outcome (<see cref="IsTrue"/>) and any validation errors.
    /// </summary>
    public class AdResponseModel
    {
        /// <summary>Unique identifier of the advertisement.</summary>
        public string Id { get; set; } = null!;

        /// <summary>Identifier of the user who owns the advertisement.</summary>
        public string OwnerId { get; set; } = string.Empty;

        /// <summary>Email address of the advertisement's owner.</summary>
        public string OwnerEmail { get; set; } = string.Empty;

        /// <summary>Short, human-readable title of the advertisement.</summary>
        public string Title { get; set; } = null!;

        /// <summary>Free-text description of the offered service.</summary>
        public string Description { get; set; } = null!;

        /// <summary>Category of service being advertised.</summary>
        public AdServiceType ServiceType { get; set; }

        /// <summary>Name of the town or city in which the service is offered.</summary>
        public string Town { get; set; } = null!;

        /// <summary>Optional latitude of the service location.</summary>
        public string? Xcordinates { get; set; } = null!;

        /// <summary>Optional longitude of the service location.</summary>
        public string? Ycordinates { get; set; } = null!;

        /// <summary>Price for the advertised service.</summary>
        public decimal Price { get; set; }

        /// <summary>Optional start date of the service's availability window.</summary>
        public DateTime? StartDate { get; set; }

        /// <summary>Optional end date of the service's availability window.</summary>
        public DateTime? EndDate { get; set; }

        /// <summary>Indicates whether the operation that produced this response succeeded.</summary>
        public bool IsTrue { get; set; }

        /// <summary>Collection of validation or business-rule errors, empty on success.</summary>
        public List<string> Erors { get; set; } = new List<string>();
    }
}
