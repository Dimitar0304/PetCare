using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using PetCare.Infrastructure.Data.Models;

namespace PetCare.Infrastructure.Data
{
    /// <summary>
    /// Entity Framework Core database context for the PetCare application.
    /// Extends <see cref="IdentityDbContext{TUser}"/> so ASP.NET Core Identity's
    /// users, roles, and claims are stored alongside the domain entities.
    /// </summary>
    public class PetcareDbContext : IdentityDbContext<User>
    {
        /// <summary>
        /// Initializes a new <see cref="PetcareDbContext"/> with the supplied options.
        /// Typically resolved from dependency injection.
        /// </summary>
        /// <param name="options">Configured EF Core options (connection string, provider, etc.).</param>
        public PetcareDbContext(DbContextOptions<PetcareDbContext> options) : base(options)
        {
        }

        /// <summary>Users registered in the application.</summary>
        public virtual DbSet<User> Users { get; set; }

        /// <summary>Advertisements published by service providers.</summary>
        public virtual DbSet<Ad> Ads { get; set; }

        /// <summary>Private messages exchanged between users.</summary>
        public virtual DbSet<Message> Messages { get; set; }

        /// <summary>
        /// Configures entity relationships and indexes:
        /// <list type="bullet">
        ///   <item><description>Ad ⇄ User one-to-many with <see cref="DeleteBehavior.Restrict"/> to prevent accidental cascade deletes.</description></item>
        ///   <item><description>Indexes on <c>Ad.Town</c>, <c>Ad.TypeService</c> and <c>Ad.CreatedOn</c> to speed up filtered/ordered listings.</description></item>
        ///   <item><description>Indexes on <c>Message.RecipientId</c>, composite <c>(RecipientId, IsRead)</c>, and <c>SenderId</c> to speed up inbox and outbox queries.</description></item>
        /// </list>
        /// </summary>
        /// <param name="builder">Model builder used to configure the schema.</param>
        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            builder.Entity<Ad>()
                .HasOne(o => o.Owner)
                .WithMany(o => o.Ads)
                .HasForeignKey(o => o.OwnerId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<Ad>()
                .HasIndex(a => a.Town);

            builder.Entity<Ad>()
                .HasIndex(a => a.TypeService);

            builder.Entity<Ad>()
                .HasIndex(a => a.CreatedOn);

            builder.Entity<Message>()
                .HasIndex(m => m.RecipientId);

            builder.Entity<Message>()
                .HasIndex(m => new { m.RecipientId, m.IsRead });

            builder.Entity<Message>()
                .HasIndex(m => m.SenderId);
        }
    }
}
