using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using MotoCore.Application.Auth.Contracts;
using MotoCore.Infrastructure.Auth;
using MotoCore.Infrastructure.Persistence;

namespace MotoCore.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var databaseProvider = configuration["Database:Provider"] ?? "InMemory";

        services.AddDbContext<MotoCoreDbContext>(options =>
        {
            if (databaseProvider.Equals("PostgreSql", StringComparison.OrdinalIgnoreCase))
            {
                var connectionString = configuration.GetConnectionString("DefaultConnection")
                    ?? throw new InvalidOperationException("DefaultConnection is required when using PostgreSql.");

                options.UseNpgsql(connectionString);
                return;
            }

            options.UseInMemoryDatabase("MotoCoreDb");
        });

        var jwtOptions = JwtOptions.FromConfiguration(configuration);
        var externalAuthenticationOptions = ExternalAuthenticationOptions.FromConfiguration(configuration);

        services.AddSingleton(jwtOptions);
        services.AddSingleton(externalAuthenticationOptions);

        services.AddScoped<IUserIdentityRepository, UserIdentityRepository>();
        services.AddScoped<IPasswordHashingService, PasswordHashingService>();
        services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();
        services.AddScoped<IRefreshTokenProtector, RefreshTokenProtector>();
        services.AddSingleton<IExternalAuthProviderCatalog, ExternalAuthProviderCatalog>();

        return services;
    }
}