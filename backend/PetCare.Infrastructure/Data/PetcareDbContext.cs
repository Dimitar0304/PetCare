using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using PetCare.Infrastructure.Data.Models;

namespace PetCare.Infrastructure.Data
{
     public class PetcareDbContext:IdentityDbContext<User>
     {
        public PetcareDbContext(DbContextOptions<PetcareDbContext> options):base(options)
        {
            
        }
        public virtual DbSet<User> Users { get; set; }
        public virtual DbSet<Ad> Ads { get; set; }
        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            builder.Entity<Ad>()
                .HasOne(o => o.Owner)
                .WithMany(o => o.Ads)
                .HasForeignKey(o => o.OwnerId)
                .OnDelete(DeleteBehavior.Restrict);

        }

    }
}
