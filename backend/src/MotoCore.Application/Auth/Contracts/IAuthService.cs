using MotoCore.Application.Auth.Models;
using MotoCore.Application.Common.Results;

namespace MotoCore.Application.Auth.Contracts;

public interface IAuthService
{
    Task<Result<AuthResponse>> RegisterAsync(RegisterAccountRequest request, string? ipAddress, CancellationToken cancellationToken = default);
    Task<Result<AuthResponse>> LoginAsync(LoginRequest request, string? ipAddress, CancellationToken cancellationToken = default);
    Task<Result<AuthResponse>> RefreshTokenAsync(RefreshTokenRequest request, string? ipAddress, CancellationToken cancellationToken = default);
    Task<Result> LogoutAsync(LogoutRequest request, string? ipAddress, CancellationToken cancellationToken = default);
    Task<Result<IReadOnlyCollection<ExternalAuthProviderResponse>>> GetExternalProvidersAsync(CancellationToken cancellationToken = default);
}