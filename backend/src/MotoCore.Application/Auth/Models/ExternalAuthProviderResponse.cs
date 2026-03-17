namespace MotoCore.Application.Auth.Models;

public sealed record ExternalAuthProviderResponse(string Name, string DisplayName, bool Enabled);