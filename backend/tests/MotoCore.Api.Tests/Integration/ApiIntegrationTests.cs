using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using MotoCore.Application.Auth.Models;
using MotoCore.Application.Clients.Models;
using MotoCore.Domain.Auth;
using MotoCore.Infrastructure.Persistence;

namespace MotoCore.Api.Tests.Integration;

/// <summary>
/// Each test creates its own <see cref="MotoCoreWebApplicationFactory"/> (not shared
/// via IClassFixture) so both the database AND the in-process rate limiter state are
/// fully isolated per test — sharing either across tests in this class would make the
/// rate-limiting test consume budget that the other tests' login calls rely on.
/// </summary>
public class ApiIntegrationTests
{
    private static RegisterAccountRequest BuildRegisterRequest(string email) =>
        new(email, "Passw0rd!", "Ana", "Perez", null, "Taller de Ana");

    [Fact]
    public async Task Register_ThenLogin_ReturnsAccessToken()
    {
        await using var factory = new MotoCoreWebApplicationFactory();
        using var client = factory.CreateClient();
        var email = $"{Guid.NewGuid()}@test.com";

        var registerResponse = await client.PostAsJsonAsync("/api/auth/register", BuildRegisterRequest(email));
        Assert.Equal(HttpStatusCode.Created, registerResponse.StatusCode);

        var loginResponse = await client.PostAsJsonAsync(
            "/api/auth/login", new LoginRequest(email, "Passw0rd!"));
        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);

        var auth = await loginResponse.Content.ReadFromJsonAsync<AuthResponse>();
        Assert.False(string.IsNullOrWhiteSpace(auth!.AccessToken));
    }

    [Fact]
    public async Task ProtectedEndpoint_WithoutToken_Returns401()
    {
        await using var factory = new MotoCoreWebApplicationFactory();
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/api/clients");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task RoleRestrictedEndpoint_WrongRole_Returns403()
    {
        await using var factory = new MotoCoreWebApplicationFactory();
        using var client = factory.CreateClient();
        var email = $"{Guid.NewGuid()}@test.com";

        await client.PostAsJsonAsync("/api/auth/register", BuildRegisterRequest(email));

        // Downgrade the newly-created owner's own workshop membership to Mechanic
        // directly in the database — POST /api/clients is Owner/Receptionist only.
        // Note: the controller's RequireRole(...) policy checks the GLOBAL UserAccount.Role
        // claim (always "Owner" for anyone who self-registered), not this per-workshop
        // membership role, so it does not actually block this request. The real
        // enforcement — and the reason this still returns 403 — is ClientService's own
        // membership.Role check, surfaced correctly since ResultExtensions maps
        // "*.insufficient_permissions" to 403. See mejoras.md for the RequireRole finding.
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<MotoCoreDbContext>();
            var membership = await db.WorkshopMemberships
                .Include(m => m.UserAccount)
                .SingleAsync(m => m.UserAccount.NormalizedEmail == email.ToUpperInvariant());
            membership.Role = SystemRoles.Mechanic;
            await db.SaveChangesAsync();
        }

        var loginResponse = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest(email, "Passw0rd!"));
        var auth = await loginResponse.Content.ReadFromJsonAsync<AuthResponse>();

        client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", auth!.AccessToken);

        var response = await client.PostAsJsonAsync(
            "/api/clients",
            new CreateClientRequest("Juan", "Lopez", "juan@test.com", "555-1234", null, null, null, null, null, null, null, null, null, null));

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Login_RateLimited_After10Attempts()
    {
        await using var factory = new MotoCoreWebApplicationFactory();
        using var client = factory.CreateClient();
        var email = $"{Guid.NewGuid()}@test.com";
        var badLogin = new LoginRequest(email, "WrongPassword1!");

        HttpResponseMessage? lastResponse = null;
        for (var i = 0; i < 11; i++)
        {
            lastResponse = await client.PostAsJsonAsync("/api/auth/login", badLogin);
        }

        Assert.Equal(HttpStatusCode.TooManyRequests, lastResponse!.StatusCode);
    }
}
