using MotoCore.Application.Auth.Contracts;
using MotoCore.Application.Auth.Models;
using MotoCore.Application.Common.Results;
using MotoCore.Domain.Auth;
using System.Net.Mail;

namespace MotoCore.Application.Auth.Services;

public sealed class AuthService(
    IUserIdentityRepository userIdentityRepository,
    IPasswordHashingService passwordHashingService,
    IJwtTokenGenerator jwtTokenGenerator,
    IRefreshTokenProtector refreshTokenProtector,
    IExternalAuthProviderCatalog externalAuthProviderCatalog) : IAuthService
{
    private const int MinimumPasswordLength = 8;
    private const int RefreshTokenLifetimeDays = 7;

    public async Task<Result<AuthResponse>> RegisterAsync(RegisterAccountRequest request, string? ipAddress, CancellationToken cancellationToken = default)
    {
        if (!IsValidEmail(request.Email))
        {
            return Result<AuthResponse>.Failure("auth.invalid_email", "The email address is not valid.");
        }

        if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < MinimumPasswordLength)
        {
            return Result<AuthResponse>.Failure("auth.invalid_password", "Password must be at least 8 characters long.");
        }

        var normalizedEmail = NormalizeEmail(request.Email);
        var existingUser = await userIdentityRepository.GetByEmailAsync(normalizedEmail, cancellationToken);

        if (existingUser is not null)
        {
            return Result<AuthResponse>.Failure("auth.email_in_use", "An account with this email already exists.");
        }

        var totalUsers = await userIdentityRepository.CountAsync(cancellationToken);
        var resolvedRole = ResolveRole(request.Role, totalUsers == 0);

        if (resolvedRole is null)
        {
            return Result<AuthResponse>.Failure("auth.invalid_role", "The selected role is not supported.");
        }

        var userAccount = new UserAccount
        {
            Email = request.Email.Trim(),
            NormalizedEmail = normalizedEmail,
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            Role = resolvedRole,
            EmailConfirmed = false,
        };

        userAccount.PasswordHash = passwordHashingService.HashPassword(userAccount, request.Password);

        await userIdentityRepository.AddAsync(userAccount, cancellationToken);

        var response = await IssueTokensAsync(userAccount, ipAddress, cancellationToken);

        return Result<AuthResponse>.Success(response);
    }

    public async Task<Result<AuthResponse>> LoginAsync(LoginRequest request, string? ipAddress, CancellationToken cancellationToken = default)
    {
        var normalizedEmail = NormalizeEmail(request.Email);
        var userAccount = await userIdentityRepository.GetByEmailAsync(normalizedEmail, cancellationToken);

        if (userAccount is null || !passwordHashingService.VerifyPassword(userAccount, request.Password))
        {
            return Result<AuthResponse>.Failure("auth.invalid_credentials", "Email or password is incorrect.");
        }

        var response = await IssueTokensAsync(userAccount, ipAddress, cancellationToken);

        return Result<AuthResponse>.Success(response);
    }

    public async Task<Result<AuthResponse>> RefreshTokenAsync(RefreshTokenRequest request, string? ipAddress, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.RefreshToken))
        {
            return Result<AuthResponse>.Failure("auth.invalid_refresh_token", "Refresh token is required.");
        }

        var now = DateTimeOffset.UtcNow;
        var refreshTokenHash = refreshTokenProtector.HashToken(request.RefreshToken);
        var userAccount = await userIdentityRepository.GetByRefreshTokenHashAsync(refreshTokenHash, cancellationToken);

        if (userAccount is null)
        {
            return Result<AuthResponse>.Failure("auth.invalid_refresh_token", "Refresh token is invalid.");
        }

        var existingRefreshToken = userAccount.RefreshTokens.SingleOrDefault(token => token.TokenHash == refreshTokenHash);

        if (existingRefreshToken is null || !existingRefreshToken.IsActive(now))
        {
            return Result<AuthResponse>.Failure("auth.invalid_refresh_token", "Refresh token is expired or revoked.");
        }

        var replacementRefreshToken = CreateRefreshToken(userAccount.Id, ipAddress, now);
        existingRefreshToken.Revoke(now, ipAddress, replacementRefreshToken.RefreshToken.TokenHash);
    await userIdentityRepository.AddRefreshTokenAsync(replacementRefreshToken.RefreshToken, cancellationToken);
        userAccount.UpdatedAtUtc = now;

        var accessToken = jwtTokenGenerator.Generate(userAccount);

        await userIdentityRepository.SaveChangesAsync(cancellationToken);

        return Result<AuthResponse>.Success(new AuthResponse(
            accessToken.Token,
            accessToken.ExpiresAtUtc,
            replacementRefreshToken.Token,
            replacementRefreshToken.ExpiresAtUtc,
            MapUser(userAccount)));
    }

    public async Task<Result> LogoutAsync(LogoutRequest request, string? ipAddress, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.RefreshToken))
        {
            return Result.Failure("auth.invalid_refresh_token", "Refresh token is required.");
        }

        var refreshTokenHash = refreshTokenProtector.HashToken(request.RefreshToken);
        var userAccount = await userIdentityRepository.GetByRefreshTokenHashAsync(refreshTokenHash, cancellationToken);

        if (userAccount is null)
        {
            return Result.Success();
        }

        var refreshToken = userAccount.RefreshTokens.SingleOrDefault(token => token.TokenHash == refreshTokenHash);

        if (refreshToken is null || !refreshToken.IsActive(DateTimeOffset.UtcNow))
        {
            return Result.Success();
        }

        refreshToken.Revoke(DateTimeOffset.UtcNow, ipAddress);
        userAccount.UpdatedAtUtc = DateTimeOffset.UtcNow;

        await userIdentityRepository.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }

    public Task<Result<IReadOnlyCollection<ExternalAuthProviderResponse>>> GetExternalProvidersAsync(CancellationToken cancellationToken = default)
    {
        var providers = externalAuthProviderCatalog.GetAvailableProviders();
        return Task.FromResult(Result<IReadOnlyCollection<ExternalAuthProviderResponse>>.Success(providers));
    }

    private async Task<AuthResponse> IssueTokensAsync(UserAccount userAccount, string? ipAddress, CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        var accessToken = jwtTokenGenerator.Generate(userAccount);
        var refreshToken = CreateRefreshToken(userAccount.Id, ipAddress, now);

        await userIdentityRepository.AddRefreshTokenAsync(refreshToken.RefreshToken, cancellationToken);
        userAccount.UpdatedAtUtc = now;

        await userIdentityRepository.SaveChangesAsync(cancellationToken);

        return new AuthResponse(
            accessToken.Token,
            accessToken.ExpiresAtUtc,
            refreshToken.Token,
            refreshToken.ExpiresAtUtc,
            MapUser(userAccount));
    }

    private GeneratedRefreshToken CreateRefreshToken(Guid userId, string? ipAddress, DateTimeOffset now)
    {
        var rawToken = refreshTokenProtector.GenerateToken();
        var refreshToken = new RefreshToken
        {
            UserAccountId = userId,
            TokenHash = refreshTokenProtector.HashToken(rawToken),
            CreatedAtUtc = now,
            CreatedByIp = ipAddress,
            ExpiresAtUtc = now.AddDays(RefreshTokenLifetimeDays),
        };

        return new GeneratedRefreshToken(rawToken, refreshToken.ExpiresAtUtc, refreshToken);
    }

    private static string NormalizeEmail(string email) => email.Trim().ToUpperInvariant();

    private static bool IsValidEmail(string email)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            return false;
        }

        try
        {
            _ = new MailAddress(email);
            return true;
        }
        catch
        {
            return false;
        }
    }

    private static string? ResolveRole(string? requestedRole, bool isFirstUser)
    {
        if (string.IsNullOrWhiteSpace(requestedRole))
        {
            return isFirstUser ? SystemRoles.Administrator : SystemRoles.Receptionist;
        }

        var normalizedRole = SystemRoles.All.FirstOrDefault(role =>
            role.Equals(requestedRole.Trim(), StringComparison.OrdinalIgnoreCase));

        return normalizedRole;
    }

    private static UserAccountResponse MapUser(UserAccount userAccount) =>
        new(userAccount.Id, userAccount.Email, userAccount.FirstName, userAccount.LastName, userAccount.Role);

    private sealed record GeneratedRefreshToken(string Token, DateTimeOffset ExpiresAtUtc, RefreshToken RefreshToken);
}