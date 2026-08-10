using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using MotoCore.Api.Controllers;
using MotoCore.Api.HealthChecks;
using MotoCore.Api.Middleware;
using MotoCore.Application;
using MotoCore.Infrastructure;
using MotoCore.Infrastructure.Auth;
using MotoCore.Infrastructure.Configuration;
using MotoCore.Infrastructure.Persistence;
using System.Text;
using System.Threading.RateLimiting;

EnvironmentFileLoader.LoadFromStandardLocations(Directory.GetCurrentDirectory(), AppContext.BaseDirectory);

var builder = WebApplication.CreateBuilder(args);
var jwtOptions = JwtOptions.FromConfiguration(builder.Configuration);

if (builder.Environment.IsProduction()
    && jwtOptions.SigningKey == "MotoCore-Development-Signing-Key-Replace-In-Production-12345")
{
    Console.Error.WriteLine(
        "WARNING: Jwt:SigningKey is still the example development key while " +
        "ASPNETCORE_ENVIRONMENT=Production. Set JWT_SIGNING_KEY (or Jwt:SigningKey) " +
        "to a real secret before exposing this instance publicly.");
}

var corsPolicyName = "Frontend";
var configuredCorsOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>()
    ?? [];

builder.Logging.ClearProviders();
builder.Logging.AddJsonConsole(options =>
{
    options.IncludeScopes = true;
    options.TimestampFormat = "yyyy-MM-ddTHH:mm:ss.fffZ";
    options.UseUtcTimestamp = true;
});

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.AddPolicy("auth", httpContext => RateLimitPartition.GetFixedWindowLimiter(
        partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        factory: _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 10,
            Window = TimeSpan.FromMinutes(1),
            QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
            QueueLimit = 0,
        }));
});

builder.Services.AddHealthChecks()
    .AddCheck<DatabaseHealthCheck>("database");
builder.Services.AddCors(options =>
{
    options.AddPolicy(corsPolicyName, policy =>
    {
        if (configuredCorsOrigins.Length > 0)
        {
            policy.WithOrigins(configuredCorsOrigins)
                .AllowAnyHeader()
                .AllowAnyMethod();

            return;
        }

        if (builder.Environment.IsDevelopment())
        {
            policy.SetIsOriginAllowed(IsLocalDevelopmentOrigin)
                .AllowAnyHeader()
                .AllowAnyMethod();
        }
    });
});

builder.Services.AddOpenApi();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "MotoCore API",
        Version = "v1",
        Description = "Authentication and workshop management API for MotoCore.",
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter a valid JWT bearer token.",
    });

    var xmlFilename = $"{typeof(Program).Assembly.GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFilename);
    if (File.Exists(xmlPath))
    {
        options.IncludeXmlComments(xmlPath);
    }

    var applicationXmlFilename = "MotoCore.Application.xml";
    var applicationXmlPath = Path.Combine(AppContext.BaseDirectory, applicationXmlFilename);
    if (File.Exists(applicationXmlPath))
    {
        options.IncludeXmlComments(applicationXmlPath);
    }
});

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidateLifetime = true,
            ValidIssuer = jwtOptions.Issuer,
            ValidAudience = jwtOptions.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.SigningKey)),
            ClockSkew = TimeSpan.Zero,
        };
    });

builder.Services.AddAuthorization();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<MotoCoreDbContext>();
    var databaseProvider = builder.Configuration["Database:Provider"] ?? "InMemory";

    if (databaseProvider.Equals("PostgreSql", StringComparison.OrdinalIgnoreCase))
    {
        dbContext.Database.Migrate();
    }
    else
    {
        dbContext.Database.EnsureCreated();
    }
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "MotoCore API v1");
        options.RoutePrefix = "swagger";
    });
}

app.UseGlobalExceptionHandling();
app.UseCors(corsPolicyName);
app.UseHttpsRedirection();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/health", () => Results.Ok(new
{
    status = "healthy",
    service = "MotoCore.Api",
    utc = DateTimeOffset.UtcNow,
})).WithTags("System");

app.MapHealthChecks("/health/db").WithTags("System");

app.MapAuthEndpoints();
app.MapUserEndpoints();
app.MapWorkshopEndpoints();
app.MapClientEndpoints();
app.MapMotorcycleEndpoints();
app.MapWorkOrderEndpoints();
app.MapInventoryEndpoints();
app.MapMaintenanceHistoryEndpoints();
app.MapAuditLogEndpoints();

app.Run();

static bool IsLocalDevelopmentOrigin(string origin)
{
    if (!Uri.TryCreate(origin, UriKind.Absolute, out var uri))
    {
        return false;
    }

    if (!uri.Scheme.Equals(Uri.UriSchemeHttp, StringComparison.OrdinalIgnoreCase)
        && !uri.Scheme.Equals(Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase))
    {
        return false;
    }

    return uri.Host.Equals("localhost", StringComparison.OrdinalIgnoreCase)
        || uri.Host.Equals("127.0.0.1", StringComparison.OrdinalIgnoreCase);
}

// Exposes the top-level-statements Program class so WebApplicationFactory<Program>
// can reference it from the test project.
public partial class Program;
