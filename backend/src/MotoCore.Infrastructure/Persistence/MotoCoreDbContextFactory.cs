using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;
using MotoCore.Infrastructure.Configuration;

namespace MotoCore.Infrastructure.Persistence;

public sealed class MotoCoreDbContextFactory : IDesignTimeDbContextFactory<MotoCoreDbContext>
{
    public MotoCoreDbContext CreateDbContext(string[] args)
    {
        var configuration = BuildConfiguration();

        var connectionString = PostgresConnectionStringResolver.Resolve(
            configuration,
            "POSTGRES_* settings, DefaultConnection, or DATABASE_URL is required to create migrations.");

        var optionsBuilder = new DbContextOptionsBuilder<MotoCoreDbContext>();
        optionsBuilder.UseNpgsql(connectionString, options =>
            options.MigrationsAssembly(typeof(MotoCoreDbContext).Assembly.FullName));

        return new MotoCoreDbContext(optionsBuilder.Options);
    }

    private static IConfiguration BuildConfiguration()
    {
        var apiProjectPath = Path.Combine(Directory.GetCurrentDirectory(), "..", "MotoCore.Api");

        EnvironmentFileLoader.LoadFromStandardLocations(
            Directory.GetCurrentDirectory(),
            apiProjectPath,
            AppContext.BaseDirectory);

        return new ConfigurationBuilder()
            .SetBasePath(apiProjectPath)
            .AddJsonFile("appsettings.json", optional: false)
            .AddJsonFile("appsettings.Development.json", optional: true)
            .AddEnvironmentVariables()
            .Build();
    }
}