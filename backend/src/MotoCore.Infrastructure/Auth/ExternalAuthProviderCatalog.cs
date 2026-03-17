using MotoCore.Application.Auth.Contracts;
using MotoCore.Application.Auth.Models;

namespace MotoCore.Infrastructure.Auth;

public sealed class ExternalAuthProviderCatalog(ExternalAuthenticationOptions authenticationOptions) : IExternalAuthProviderCatalog
{
    public IReadOnlyCollection<ExternalAuthProviderResponse> GetAvailableProviders() =>
        authenticationOptions.Providers
            .Select(provider => new ExternalAuthProviderResponse(provider.Name, provider.DisplayName, provider.Enabled))
            .ToArray();
}