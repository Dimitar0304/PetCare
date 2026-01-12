using PetCare.Infrastructure.Data.Models;

namespace PetCare.Core.Models
{
    public class AdRequestModel
    {
        public string Title { get; set; } = null!;
        public string Description { get; set; } = null!;
        public AdServiceType ServiceType { get; set; }
        public string Town { get; set; } = null!;
        public string Xcordinates { get; set; } = null!;
        public string Ycordinates { get; set; } = null!;
        public decimal Price { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
    }
}
