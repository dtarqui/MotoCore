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
    Task<Result> ChangePasswordAsync(Guid userId, ChangePasswordRequest request, CancellationToken cancellationToken = default);
    Task<Result> ForgotPasswordAsync(ForgotPasswordRequest request, CancellationToken cancellationToken = default);
    Task<Result> ResetPasswordAsync(ResetPasswordRequest request, CancellationToken cancellationToken = default);
    Task<Result> ConfirmEmailAsync(ConfirmEmailRequest request, CancellationToken cancellationToken = default);
    Task<Result> ResendConfirmationAsync(ResendConfirmationRequest request, CancellationToken cancellationToken = default);
}