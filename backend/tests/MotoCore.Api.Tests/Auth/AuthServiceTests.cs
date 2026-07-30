using Microsoft.Extensions.Logging.Abstractions;
using MotoCore.Api.Tests.TestSupport;
using MotoCore.Application.Auth.Models;
using MotoCore.Application.Auth.Services;
using MotoCore.Domain.Auth;
using MotoCore.Infrastructure.Auth;
using MotoCore.Infrastructure.Persistence;

namespace MotoCore.Api.Tests.Auth;

public class AuthServiceTests
{
    private static AuthService CreateService(MotoCoreDbContext context) =>
        new(
            new UserIdentityRepository(context),
            new PasswordHashingService(),
            new JwtTokenGenerator(new JwtOptions()),
            new RefreshTokenProtector(),
            new ExternalAuthProviderCatalog(new ExternalAuthenticationOptions()),
            new WorkshopRepository(context),
            new LoggingEmailSender(NullLogger<LoggingEmailSender>.Instance));

    private static RegisterAccountRequest BuildRegisterRequest(string email = "owner@shop.com", string password = "Passw0rd!") =>
        new(email, password, "Ana", "Perez", null, "Ana's Workshop");

    [Fact]
    public async Task RegisterAsync_CreatesOwnerWithWorkshopAndMembership()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var service = CreateService(context);

        var result = await service.RegisterAsync(BuildRegisterRequest(), "127.0.0.1");

        Assert.True(result.IsSuccess);
        Assert.Equal(SystemRoles.Owner, result.Value!.User.Role);
        Assert.NotEmpty(result.Value.AccessToken);
        Assert.NotEmpty(result.Value.RefreshToken);

        var workshop = context.Workshops.Single();
        Assert.Equal(result.Value.User.Id, workshop.OwnerId);

        var membership = context.WorkshopMemberships.Single();
        Assert.Equal(SystemRoles.Owner, membership.Role);
        Assert.True(membership.IsActive);
    }

    [Fact]
    public async Task RegisterAsync_Fails_WhenEmailAlreadyInUse()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var service = CreateService(context);

        await service.RegisterAsync(BuildRegisterRequest("duplicate@shop.com"), "127.0.0.1");
        var result = await service.RegisterAsync(BuildRegisterRequest("Duplicate@Shop.com"), "127.0.0.1");

        Assert.False(result.IsSuccess);
        Assert.Equal("auth.email_in_use", result.Error!.Code);
    }

    [Fact]
    public async Task RegisterAsync_Fails_WhenPasswordTooShort()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var service = CreateService(context);

        var result = await service.RegisterAsync(BuildRegisterRequest(password: "short"), "127.0.0.1");

        Assert.False(result.IsSuccess);
        Assert.Equal("auth.invalid_password", result.Error!.Code);
    }

    [Fact]
    public async Task LoginAsync_Fails_WithWrongPassword()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var service = CreateService(context);
        await service.RegisterAsync(BuildRegisterRequest("owner2@shop.com"), "127.0.0.1");

        var result = await service.LoginAsync(new LoginRequest("owner2@shop.com", "WrongPassword1!"), "127.0.0.1");

        Assert.False(result.IsSuccess);
        Assert.Equal("auth.invalid_credentials", result.Error!.Code);
    }

    [Fact]
    public async Task LoginAsync_Succeeds_AndIssuesTokens()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var service = CreateService(context);
        await service.RegisterAsync(BuildRegisterRequest("owner3@shop.com", "Passw0rd!"), "127.0.0.1");

        var result = await service.LoginAsync(new LoginRequest("owner3@shop.com", "Passw0rd!"), "127.0.0.1");

        Assert.True(result.IsSuccess);
        Assert.NotEmpty(result.Value!.AccessToken);
        Assert.NotEmpty(result.Value.RefreshToken);
    }

    [Fact]
    public async Task RefreshTokenAsync_RotatesToken_AndRejectsReuseOfOldToken()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var service = CreateService(context);
        var registerResult = await service.RegisterAsync(BuildRegisterRequest("owner4@shop.com"), "127.0.0.1");
        var originalRefreshToken = registerResult.Value!.RefreshToken;

        var refreshed = await service.RefreshTokenAsync(new RefreshTokenRequest(originalRefreshToken), "127.0.0.1");

        Assert.True(refreshed.IsSuccess);
        Assert.NotEqual(originalRefreshToken, refreshed.Value!.RefreshToken);

        var reuseAttempt = await service.RefreshTokenAsync(new RefreshTokenRequest(originalRefreshToken), "127.0.0.1");

        Assert.False(reuseAttempt.IsSuccess);
        Assert.Equal("auth.invalid_refresh_token", reuseAttempt.Error!.Code);
    }
}
