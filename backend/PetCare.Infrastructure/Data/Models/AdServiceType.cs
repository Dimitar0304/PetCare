namespace PetCare.Infrastructure.Data.Models
{
    /// <summary>
    /// Enumerates the categories of pet-care services that can be advertised.
    /// Stored in the database as <c>int</c>; values are persisted and must not be reordered.
    /// </summary>
    public enum AdServiceType
    {
        /// <summary>Walking a customer's dog.</summary>
        DogWalking = 1,

        /// <summary>Feeding a customer's animal at scheduled times.</summary>
        FeedingAnimal = 2,

        /// <summary>Caring for a pet overnight, usually at the provider's or customer's home.</summary>
        OvernightCare = 3,

        /// <summary>General pet sitting while the owner is away.</summary>
        PetSitting = 4,

        /// <summary>Custom service that does not fit the other categories; details provided in the ad description.</summary>
        SomethingSpecific = 5
    }
}
