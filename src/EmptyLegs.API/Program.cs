using System.Text;
using EmptyLegs.Application.Hubs;
using EmptyLegs.Application.Services;
using EmptyLegs.Infrastructure.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// ─── Database ─────────────────────────────────────────────────────────────────
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

// ─── JWT Authentication ───────────────────────────────────────────────────────
var jwtSecret = builder.Configuration["Jwt:Secret"]
    ?? "PearlSkyS3cur3K3y!2024SuperSecretKeyForJWTTokenGeneration";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "PearlSky";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "PearlSkyApp";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret))
    };

    // Support JWT in SignalR query string
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization();

// ─── Application Services ─────────────────────────────────────────────────────
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<EmptyLegService>();
builder.Services.AddScoped<OperatorService>();
builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<AdminService>();
builder.Services.AddScoped<EmailService>();

// ─── SignalR ──────────────────────────────────────────────────────────────────
builder.Services.AddSignalR();

// ─── CORS ─────────────────────────────────────────────────────────────────────
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy
            .SetIsOriginAllowed(_ => true)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// ─── Controllers ─────────────────────────────────────────────────────────────
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Accept enum values as strings (e.g. "Midsize", "Instant") from Angular
        options.JsonSerializerOptions.Converters.Add(
            new System.Text.Json.Serialization.JsonStringEnumConverter());
    });
builder.Services.AddEndpointsApiExplorer();

// ─── Cloud Hosting: use PORT env var injected by Render / Railway / Fly.io ───
var cloudPort = Environment.GetEnvironmentVariable("PORT");
if (!string.IsNullOrEmpty(cloudPort))
    builder.WebHost.UseUrls($"http://+:{cloudPort}");

var app = builder.Build();

// ─── Ensure DB + Seed ─────────────────────────────────────────────────────────
await app.EnsureDatabaseAsync();

// ─── HTTP Pipeline ────────────────────────────────────────────────────────────
// CORS must come BEFORE UseRouting so the CORS middleware is registered
// in the pipeline before any endpoint CORS metadata checks occur.
app.UseCors();

// ─── Request/Response Logging ────────────────────────────────────────────────
app.Use(async (context, next) =>
{
    var start = DateTime.UtcNow;
    var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();
    logger.LogInformation("[REQ] {Method} {Path}{Query}",
        context.Request.Method,
        context.Request.Path,
        context.Request.QueryString);
    try
    {
        await next(context);
        var elapsed = (DateTime.UtcNow - start).TotalMilliseconds;
        var level = context.Response.StatusCode >= 400 ? LogLevel.Warning : LogLevel.Information;
        logger.Log(level, "[RES] {Method} {Path} → {Status} ({Elapsed:F0}ms)",
            context.Request.Method,
            context.Request.Path,
            context.Response.StatusCode,
            elapsed);
    }
    catch (Exception ex)
    {
        var elapsed = (DateTime.UtcNow - start).TotalMilliseconds;
        logger.LogError(ex, "[ERR] {Method} {Path} threw after {Elapsed:F0}ms: {Message}",
            context.Request.Method,
            context.Request.Path,
            elapsed,
            ex.Message);
        throw;
    }
});

app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<BookingHub>("/hubs/booking");

// ─── SPA Static Files (Angular build output in wwwroot/browser) ───────────────
var spaPath = Path.Combine(builder.Environment.WebRootPath ?? "wwwroot", "browser");
if (Directory.Exists(spaPath))
{
    var fileProvider = new PhysicalFileProvider(spaPath);
    var contentTypeProvider = new FileExtensionContentTypeProvider();

    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = fileProvider,
        RequestPath = ""
    });

    // SPA fallback: any unmatched route → index.html
    app.MapFallback(async context =>
    {
        context.Response.ContentType = "text/html";
        await context.Response.SendFileAsync(Path.Combine(spaPath, "index.html"));
    });
}
else
{
    // wwwroot/browser not found (dev mode - Angular served separately on :4200)
    app.MapGet("/", () => "PearlSky API is running. Frontend served by Angular dev server on :4200");
}

app.Run();

// ─── Extension: EnsureDatabaseAsync ──────────────────────────────────────────
public static class WebApplicationExtensions
{
    public static async Task EnsureDatabaseAsync(this WebApplication app)
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // Look for seed-data folder — try exe directory first (works for published builds),
        // then AppContext.BaseDirectory, then common development relative paths.
        var exeDir = Path.GetDirectoryName(Environment.ProcessPath) ?? AppContext.BaseDirectory;
        var seedPath = Path.Combine(exeDir, "seed-data");
        if (!Directory.Exists(seedPath))
            seedPath = Path.Combine(AppContext.BaseDirectory, "seed-data");
        if (!Directory.Exists(seedPath))
            seedPath = Path.Combine(Directory.GetCurrentDirectory(), "seed-data");
        if (!Directory.Exists(seedPath))
            seedPath = Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "seed-data");
        if (!Directory.Exists(seedPath))
            seedPath = Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "..", "..", "seed-data");
        // Normalize the path
        seedPath = Path.GetFullPath(seedPath);
        await SeedData.InitializeAsync(db, seedPath);

        // Enable WAL mode for SQLite — allows concurrent reads + one writer,
        // eliminating "database is locked" errors during concurrent requests.
        await db.Database.ExecuteSqlRawAsync("PRAGMA journal_mode=WAL;");
        await db.Database.ExecuteSqlRawAsync("PRAGMA synchronous=NORMAL;");
        await db.Database.ExecuteSqlRawAsync("PRAGMA busy_timeout=5000;");

        // Add indexes for search performance (CREATE INDEX IF NOT EXISTS is idempotent)
        await db.Database.ExecuteSqlRawAsync(
            "CREATE INDEX IF NOT EXISTS IX_EmptyLegs_Status ON EmptyLegs(Status);");
        await db.Database.ExecuteSqlRawAsync(
            "CREATE INDEX IF NOT EXISTS IX_EmptyLegs_DepartureUtc ON EmptyLegs(DepartureUtc);");
        await db.Database.ExecuteSqlRawAsync(
            "CREATE INDEX IF NOT EXISTS IX_EmptyLegs_Origin ON EmptyLegs(Origin);");
        await db.Database.ExecuteSqlRawAsync(
            "CREATE INDEX IF NOT EXISTS IX_EmptyLegs_Destination ON EmptyLegs(Destination);");
        await db.Database.ExecuteSqlRawAsync(
            "CREATE INDEX IF NOT EXISTS IX_Notifications_UserId ON Notifications(UserId, IsRead);");
        await db.Database.ExecuteSqlRawAsync(
            "CREATE INDEX IF NOT EXISTS IX_Bookings_UserId ON Bookings(UserId);");
        await db.Database.ExecuteSqlRawAsync(
            "CREATE INDEX IF NOT EXISTS IX_Bookings_OperatorId ON Bookings(OperatorId);");

        // JetSubscriptions — created via raw SQL for schema evolution without migration
        await db.Database.ExecuteSqlRawAsync("""
            CREATE TABLE IF NOT EXISTS JetSubscriptions (
                Id INTEGER PRIMARY KEY AUTOINCREMENT,
                UserId INTEGER NOT NULL,
                JetId INTEGER NOT NULL,
                CreatedAt TEXT NOT NULL DEFAULT (datetime('now')),
                FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE,
                FOREIGN KEY (JetId) REFERENCES Jets(Id) ON DELETE CASCADE,
                UNIQUE(UserId, JetId)
            );
            """);
        await db.Database.ExecuteSqlRawAsync(
            "CREATE INDEX IF NOT EXISTS IX_JetSubscriptions_UserId ON JetSubscriptions(UserId);");
    }
}
