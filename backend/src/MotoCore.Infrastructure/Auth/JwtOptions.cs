using Microsoft.Extensions.Configuration;

namespace MotoCore.Infrastructure.Auth;

public sealed class JwtOptions
{
    public const string SectionName = "Jwt";

    public string Issuer { get; init; } = "MotoCore";
    public string Audience { get; init; } = "MotoCore.Client";
    public string SigningKey { get; init; } = "MotoCore-Development-Signing-Key-Replace-In-Production-12345";
    public int AccessTokenMinutes { get; init; } = 15;
    public int RefreshTokenDays { get; init; } = 7;

    public static JwtOptions FromConfiguration(IConfiguration configuration) => new()
    {
        Issuer = configuration[$"{SectionName}:Issuer"] ?? "MotoCore",
        Audience = configuration[$"{SectionName}:Audience"] ?? "MotoCore.Client",
        SigningKey = configuration[$"{SectionName}:SigningKey"] ?? "MotoCore-Development-Signing-Key-Replace-In-Production-12345",
        AccessTokenMinutes = int.TryParse(configuration[$"{SectionName}:AccessTokenMinutes"], out var accessTokenMinutes) ? accessTokenMinutes : 15,
        RefreshTokenDays = int.TryParse(configuration[$"{SectionName}:RefreshTokenDays"], out var refreshTokenDays) ? refreshTokenDays : 7,
    };
}