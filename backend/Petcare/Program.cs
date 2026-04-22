using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using PetCare.Core.Services.Ads;
using PetCare.Core.Services.Contracts;
using PetCare.Core.Services.Email;
using PetCare.Core.Services.JWT;
using PetCare.Core.Services.Messages;
using PetCare.Core.Services.Weather;
using PetCare.Infrastructure.Data;
using PetCare.Infrastructure.Data.Models;
using System.Text;

// ------------------------------------------------------------
// Application startup
// ------------------------------------------------------------
// Configures ASP.NET Core services (Identity, EF Core, JWT auth, CORS,
// application services and the Weather AI dependencies), then runs a
// startup migration + demo-data seeding block so the frontend has
// something to display on a fresh database.
// ------------------------------------------------------------

const string CorsPolicyName = "CorsPolicy";
const string FrontendOrigin = "http://localhost:4200";
const string FrontendOriginSecure = "https://localhost:4200";

var builder = WebApplication.CreateBuilder(args);

ConfigureServices(builder);

var app = builder.Build();

await SeedDatabaseAsync(app);

ConfigurePipeline(app);

app.Run();

// ------------------------------------------------------------
// Local helpers
// ------------------------------------------------------------

static void ConfigureServices(WebApplicationBuilder builder)
{
    var services = builder.Services;
    var config = builder.Configuration;

    services.AddControllers();
    services.AddHttpContextAccessor();
    services.AddOpenApi();

    services.AddIdentity<User, IdentityRole>(opt =>
        {
            opt.Password.RequireNonAlphanumeric = false;
            opt.Password.RequireUppercase = false;
            opt.Password.RequireLowercase = false;
            opt.Password.RequireDigit = false;
            opt.SignIn.RequireConfirmedEmail = false;
        })
        .AddEntityFrameworkStores<PetcareDbContext>();

    // DbContext pooling reduces allocations and improves throughput/latency.
    services.AddDbContextPool<PetcareDbContext>(opt =>
        opt.UseNpgsql(config.GetConnectionString("ConnectionString")));

    // Application services.
    services.AddTransient<IAdService, AdService>();
    services.AddScoped<IJwtService, JWTService>();
    services.AddTransient<IMessageService, MessageService>();
    services.AddTransient<IEmailSender, SmtpEmailSender>();

    // Weather AI agent.
    services.AddMemoryCache();
    services.AddHttpClient<OpenWeatherClient>();
    services.AddTransient<IWeatherAiService, WeatherAiService>();

    ConfigureAuthentication(services, config);

    services.AddAuthorization(options =>
    {
        options.FallbackPolicy = options.DefaultPolicy;
    });

    services.AddCors(options =>
    {
        options.AddPolicy(CorsPolicyName, policy =>
            policy.WithOrigins(FrontendOrigin, FrontendOriginSecure)
                  .AllowAnyHeader()
                  .AllowAnyMethod());
    });
}

static void ConfigureAuthentication(IServiceCollection services, IConfiguration config)
{
    // AddIdentity (above) registers cookie auth as the default challenge scheme.
    // We must explicitly override all three default scheme properties so that
    // unauthenticated API calls get 401/403 instead of a redirect to /Account/Login.
    services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        // .NET 9 JsonWebTokenHandler does not auto-remap short claim names;
        // MapInboundClaims = true restores the classic ClaimTypes.NameIdentifier mapping.
        options.MapInboundClaims = true;

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = config["Jwt:Issuer"],
            ValidAudience = config["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(config["Jwt:Key"]!)),
        };
    });
}

static void ConfigurePipeline(WebApplication app)
{
    if (app.Environment.IsDevelopment())
    {
        app.MapOpenApi();
        // Only redirect to HTTPS in Development (where dev certs exist).
        // In Docker/Production the app is behind nginx on HTTP only.
        app.UseHttpsRedirection();
    }

    app.UseCors(CorsPolicyName);
    app.UseAuthentication();
    app.UseAuthorization();
    app.MapControllers();
}

static async Task SeedDatabaseAsync(WebApplication app)
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<PetcareDbContext>();

    try
    {
        await MigrateWithRetryAsync(db);

        var owner = await EnsureSeedUserAsync(scope);
        if (owner is null)
        {
            Console.WriteLine("[Seed] Skipping demo ads insert. owner=null");
            return;
        }

        if (await db.Ads.AnyAsync())
        {
            Console.WriteLine("[Seed] Skipping demo ads insert. adsAny=True");
            return;
        }

        db.Ads.AddRange(BuildDemoAds(owner.Id));
        await db.SaveChangesAsync();
        Console.WriteLine($"[Seed] Inserted demo ads. Total ads now: {await db.Ads.CountAsync()}");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[Seed] Demo ads seeding failed: {ex}");
    }
}

static async Task MigrateWithRetryAsync(PetcareDbContext db)
{
    // In Docker, the DB container may need a moment to be fully ready.
    // Retry migration up to N times with increasing delays.
    const int maxRetries = 10;

    for (var attempt = 1; attempt <= maxRetries; attempt++)
    {
        try
        {
            await db.Database.MigrateAsync();
            Console.WriteLine("[Startup] Database migration applied.");
            return;
        }
        catch (Exception ex) when (attempt < maxRetries)
        {
            var delay = TimeSpan.FromSeconds(attempt * 2);
            Console.WriteLine($"[Startup] Migration attempt {attempt} failed ({ex.Message}). Retrying in {delay.TotalSeconds}s...");
            await Task.Delay(delay);
        }
    }
}

static async Task<User?> EnsureSeedUserAsync(IServiceScope scope)
{
    const string seedEmail = "seed.user@petcare.local";
    const string seedUsername = "seed.user";
    const string seedPassword = "Seed1234!";

    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<User>>();

    var existing = await userManager.FindByEmailAsync(seedEmail);
    if (existing is not null) return existing;

    var seedUser = new User
    {
        FirstName = "Seed",
        LastName = "User",
        UserName = seedUsername,
        Email = seedEmail,
        PhoneNumber = "0000000000",
        Role = 2, // PetOwner => Seeker (see JWTService mapping)
    };

    var result = await userManager.CreateAsync(seedUser, seedPassword);
    return result.Succeeded ? await userManager.FindByEmailAsync(seedEmail) : null;
}

static IEnumerable<Ad> BuildDemoAds(string ownerId)
{
    (string Title, string Description, string Town, string X, string Y, decimal Price, AdServiceType Type)[] templates =
    {
        ("Dog walking in Sofia",     "Friendly dog walking in central Sofia. 30-60 mins per visit.",
                                     "Sofia",   "23.3219", "42.6977", 30m, AdServiceType.DogWalking),
        ("Pet sitting in Plovdiv",   "Overnight-ready pet sitting with updates and care plan.",
                                     "Plovdiv", "24.7465", "42.1354", 55m, AdServiceType.PetSitting),
        ("Feeding help in Varna",    "Daily feeding visits in Varna with fresh water and notes.",
                                     "Varna",   "27.9244", "43.2141", 25m, AdServiceType.FeedingAnimal),
        ("Overnight care in Burgas", "Comfortable overnight care with regular check-ins.",
                                     "Burgas",  "27.4623", "42.5048", 60m, AdServiceType.OvernightCare),
        ("Specific request in Ruse", "Special care arrangements. Message me and I will confirm availability.",
                                     "Ruse",    "25.9465", "43.8350", 45m, AdServiceType.SomethingSpecific),
    };

    var now = DateTime.UtcNow;
    return templates.Select(t => new Ad
    {
        Id = Guid.NewGuid().ToString(),
        Title = t.Title,
        Description = t.Description,
        Town = t.Town,
        Xcordinates = t.X,
        Ycordinates = t.Y,
        Price = t.Price,
        TypeService = t.Type,
        StartDate = now,
        EndDate = now.AddDays(14),
        OwnerId = ownerId,
    });
}
