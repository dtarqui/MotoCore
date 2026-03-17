using MotoCore.Application.Auth.Models;

namespace MotoCore.Application.Auth.Contracts;

public interface IExternalAuthProviderCatalog
{
    IReadOnlyCollection<ExternalAuthProviderResponse> GetAvailableProviders();
}