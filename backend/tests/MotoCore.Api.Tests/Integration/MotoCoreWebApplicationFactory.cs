using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using MotoCore.Infrastructure.Persistence;

namespace MotoCore.Api.Tests.Integration;

/// <summary>
/// Boots the real ASP.NET Core pipeline (routing, auth policies, rate limiting,
/// validation filters) against a fresh, isolated InMemory database per factory
/// instance — the one thing service-level tests structurally cannot exercise.
/// </summary>
public sealed class MotoCoreWebApplicationFactory : WebApplicationFactory<Program>
{
    // Computed once per factory instance: WebApplicationFactory can invoke
    // ConfigureWebHost/ConfigureServices more than once while building the host,
    // so generating the name inline in the lambda would produce a different
    // InMemory database each time it runs, leaving requests and test-side
    // assertions pointed at different stores.
    private readonly string _databaseName = Guid.NewGuid().ToString();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseSetting("Database:Provider", "InMemory");

        builder.ConfigureServices(services =>
        {
            services.RemoveAll<DbContextOptions<MotoCoreDbContext>>();
            services.AddDbContext<MotoCoreDbContext>(options =>
                options.UseInMemoryDatabase(_databaseName));
        });
    }
}
