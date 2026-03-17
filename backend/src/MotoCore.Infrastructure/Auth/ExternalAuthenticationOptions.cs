using Microsoft.Extensions.Configuration;

namespace MotoCore.Infrastructure.Auth;

public sealed class ExternalAuthenticationOptions
{
    public const string SectionName = "Authentication:ExternalProviders";

    public IReadOnlyCollection<ExternalProviderOptions> Providers { get; init; } = [];

    public static ExternalAuthenticationOptions FromConfiguration(IConfiguration configuration)
    {
        var providers = configuration.GetSection(SectionName)
            .GetChildren()
            .Select(section => new ExternalProviderOptions
            {
                Name = section["Name"] ?? string.Empty,
                DisplayName = section["DisplayName"] ?? section["Name"] ?? string.Empty,
                Enabled = bool.TryParse(section["Enabled"], out var enabled) && enabled,
            })
            .Where(provider => !string.IsNullOrWhiteSpace(provider.Name))
            .ToArray();

        return new ExternalAuthenticationOptions
        {
            Providers = providers,
        };
    }
}

public sealed class ExternalProviderOptions
{
    public string Name { get; init; } = string.Empty;
    public string DisplayName { get; init; } = string.Empty;
    public bool Enabled { get; init; }
}