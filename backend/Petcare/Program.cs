using Microsoft.AspNet.Identity;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using PetCare.Core.Services.Ads;
using PetCare.Core.Services.Contracts;
using PetCare.Core.Services.JWT;
using PetCare.Infrastructure.Data;
using PetCare.Infrastructure.Data.Models;
using System;
using System.Text;
using Microsoft.Extensions.DependencyInjection;
using System.Linq;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddHttpContextAccessor();
builder.Services.AddIdentity<User, IdentityRole>(opt=>
    {
        opt.Password.RequireNonAlphanumeric = false;
        opt.Password.RequireUppercase = false;
        opt.Password.RequireLowercase = false;
        opt.Password.RequireDigit = false;
        opt.SignIn.RequireConfirmedEmail = false;
})
    .AddEntityFrameworkStores<PetcareDbContext>();

builder.Services.AddTransient<IAdService, AdService>();
builder.Services.AddScoped<IJwtService, JWTService>();

builder.Services.AddOpenApi();

var cString = builder.Configuration.GetConnectionString("ConnectionString");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]))
        };
    });

// DbContext pooling reduces allocations and improves throughput/latency.
builder.Services.AddDbContextPool<PetcareDbContext>(opt =>
    opt.UseNpgsql(cString));

builder.Services.AddAuthorization(options =>
{
    options.FallbackPolicy = options.DefaultPolicy;
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("CorsPolicy", policy =>
    {
        policy.WithOrigins("http://localhost:4200", "https://localhost:4200")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

// Seed a small set of demo data so the frontend immediately shows ads on first run.
// This only runs when the database is empty.
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<PetcareDbContext>();

    try
    {
        // Ensure a known demo user exists (ads require OwnerId).
        var seedEmail = "seed.user@petcare.local";
        var seedUsername = "seed.user";
        var seedPassword = "Seed1234!";

        var owner = db.Users.FirstOrDefault(u => u.Email == seedEmail);
        if (owner == null)
        {
            var userManager = scope.ServiceProvider.GetRequiredService<Microsoft.AspNetCore.Identity.UserManager<User>>();

            var seedUser = new User
            {
                FirstName = "Seed",
                LastName = "User",
                UserName = seedUsername,
                Email = seedEmail,
                PhoneNumber = "0000000000",
                Role = 2 // PetOwner => Seeker (see JWTService mapping)
            };

            var result = await userManager.CreateAsync(seedUser, seedPassword);
            if (result.Succeeded)
            {
                owner = db.Users.FirstOrDefault(u => u.Email == seedEmail);
            }
        }
        if (owner != null && !db.Ads.Any())
        {
            db.Ads.AddRange(
                new Ad
                {
                Id = Guid.NewGuid().ToString(),
                    Title = "Dog walking in Sofia",
                    Description = "Friendly dog walking in central Sofia. 30-60 mins per visit.",
                    Town = "Sofia",
                    Xcordinates = "23.3219", // longitude
                    Ycordinates = "42.6977", // latitude
                    Price = 30m,
                    TypeService = AdServiceType.DogWalking,
                StartDate = DateTime.UtcNow,
                EndDate = DateTime.UtcNow.AddDays(14),
                    OwnerId = owner.Id
                },
                new Ad
                {
                Id = Guid.NewGuid().ToString(),
                    Title = "Pet sitting in Plovdiv",
                    Description = "Overnight-ready pet sitting with updates and care plan.",
                    Town = "Plovdiv",
                    Xcordinates = "24.7465",
                    Ycordinates = "42.1354",
                    Price = 55m,
                    TypeService = AdServiceType.PetSitting,
                StartDate = DateTime.UtcNow,
                EndDate = DateTime.UtcNow.AddDays(14),
                    OwnerId = owner.Id
                },
                new Ad
                {
                Id = Guid.NewGuid().ToString(),
                    Title = "Feeding help in Varna",
                    Description = "Daily feeding visits in Varna with fresh water and notes.",
                    Town = "Varna",
                    Xcordinates = "27.9244",
                    Ycordinates = "43.2141",
                    Price = 25m,
                    TypeService = AdServiceType.FeedingAnimal,
                StartDate = DateTime.UtcNow,
                EndDate = DateTime.UtcNow.AddDays(14),
                    OwnerId = owner.Id
                },
                new Ad
                {
                Id = Guid.NewGuid().ToString(),
                    Title = "Overnight care in Burgas",
                    Description = "Comfortable overnight care with regular check-ins.",
                    Town = "Burgas",
                    Xcordinates = "27.4623",
                    Ycordinates = "42.5048",
                    Price = 60m,
                    TypeService = AdServiceType.OvernightCare,
                StartDate = DateTime.UtcNow,
                EndDate = DateTime.UtcNow.AddDays(14),
                    OwnerId = owner.Id
                },
                new Ad
                {
                Id = Guid.NewGuid().ToString(),
                    Title = "Specific request in Ruse",
                    Description = "Special care arrangements. Message me and I will confirm availability.",
                    Town = "Ruse",
                    Xcordinates = "25.9465",
                    Ycordinates = "43.8350",
                    Price = 45m,
                    TypeService = AdServiceType.SomethingSpecific,
                StartDate = DateTime.UtcNow,
                EndDate = DateTime.UtcNow.AddDays(14),
                    OwnerId = owner.Id
                }
            );

            await db.SaveChangesAsync();
            Console.WriteLine($"[Seed] Inserted demo ads. Total ads now: {db.Ads.Count()}");
        }
        else
        {
            Console.WriteLine($"[Seed] Skipping demo ads insert. owner={(owner != null ? "present" : "null")}, adsAny={db.Ads.Any()}");
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[Seed] Demo ads seeding failed: {ex}");
    }
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseCors("CorsPolicy");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
