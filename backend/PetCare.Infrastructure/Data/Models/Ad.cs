using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PetCare.Infrastructure.Data.Models
{
    public class Ad
    {
        //Main information
        [Key]
        public string Id { get; set; } = null!;
        public string Title { get; set; } = null!;
        public string Description { get; set; } = null!;

        //Service type
        public AdServiceType TypeService { get; set; }

        //Location
        public string Town { get; set; } = null!;
        public string Xcordinates { get; set; } = null!;
        public string Ycordinates { get; set; } = null!;

        //Price
        public decimal Price { get; set; }

        //Time
        public DateTime CreatedOn { get; set; } = DateTime.UtcNow;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }

        //Owner of Ad
        [ForeignKey(nameof(User))]
        public string OwnerId { get; set; } = null!;
        public User Owner { get; set; } = null!;

    }
}
