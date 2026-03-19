using Microsoft.Extensions.Configuration;
using Npgsql;

namespace MotoCore.Infrastructure.Persistence;

internal static class PostgresConnectionStringResolver
{
    public static string Resolve(IConfiguration configuration, string missingConnectionStringMessage)
    {
        if (TryBuildFromSettings(configuration, out var connectionString))
        {
            return connectionString;
        }

        var databaseUrl = configuration["DATABASE_URL"];
        if (!string.IsNullOrWhiteSpace(databaseUrl))
        {
            return BuildFromDatabaseUrl(databaseUrl);
        }

        connectionString = configuration.GetConnectionString("DefaultConnection");
        if (!string.IsNullOrWhiteSpace(connectionString))
        {
            return connectionString;
        }

        throw new InvalidOperationException(missingConnectionStringMessage);
    }

    private static bool TryBuildFromSettings(IConfiguration configuration, out string connectionString)
    {
        var host = configuration["POSTGRES_HOST"];
        if (string.IsNullOrWhiteSpace(host))
        {
            connectionString = string.Empty;
            return false;
        }

        var builder = CreateBuilder(
            host,
            GetPort(configuration["POSTGRES_PORT"]),
            GetRequiredValue(configuration, "POSTGRES_DB"),
            GetRequiredValue(configuration, "POSTGRES_USER"),
            GetRequiredValue(configuration, "POSTGRES_PASSWORD"));
        ApplySslMode(builder, configuration["POSTGRES_SSL_MODE"]);
        ApplyRenderDefaults(builder);

        connectionString = builder.ConnectionString;
        return true;
    }

    private static string BuildFromDatabaseUrl(string value)
    {
        if (!Uri.TryCreate(value, UriKind.Absolute, out var uri)
            || (uri.Scheme != "postgres" && uri.Scheme != "postgresql"))
        {
            return value;
        }

        var credentials = uri.UserInfo.Split(':', 2, StringSplitOptions.TrimEntries);
        var builder = CreateBuilder(
            uri.Host,
            uri.IsDefaultPort ? 5432 : uri.Port,
            uri.AbsolutePath.Trim('/'),
            credentials.Length > 0 ? Uri.UnescapeDataString(credentials[0]) : string.Empty,
            credentials.Length > 1 ? Uri.UnescapeDataString(credentials[1]) : string.Empty);

        foreach (var pair in GetQueryParameters(uri.Query))
        {
            if (!pair.Key.Equals("sslmode", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            ApplySslMode(builder, pair.Value);
        }

        ApplyRenderDefaults(builder);

        return builder.ConnectionString;
    }

    private static NpgsqlConnectionStringBuilder CreateBuilder(
        string host,
        int port,
        string database,
        string username,
        string password)
    {
        return new NpgsqlConnectionStringBuilder
        {
            Host = host,
            Port = port,
            Database = database,
            Username = username,
            Password = password,
        };
    }

    private static IEnumerable<KeyValuePair<string, string>> GetQueryParameters(string query)
    {
        foreach (var pair in query.TrimStart('?').Split('&', StringSplitOptions.RemoveEmptyEntries))
        {
            var tokens = pair.Split('=', 2, StringSplitOptions.TrimEntries);
            if (tokens.Length != 2)
            {
                continue;
            }

            yield return new KeyValuePair<string, string>(
                Uri.UnescapeDataString(tokens[0]),
                Uri.UnescapeDataString(tokens[1]));
        }
    }

    private static void ApplySslMode(NpgsqlConnectionStringBuilder builder, string? sslMode)
    {
        if (!string.IsNullOrWhiteSpace(sslMode)
            && Enum.TryParse<SslMode>(sslMode, true, out var parsedSslMode))
        {
            builder.SslMode = parsedSslMode;
        }
    }

    private static void ApplyRenderDefaults(NpgsqlConnectionStringBuilder builder)
    {
        var host = builder.Host;
        if (builder.SslMode == SslMode.Disable
            && !string.IsNullOrWhiteSpace(host)
            && host.EndsWith("render.com", StringComparison.OrdinalIgnoreCase))
        {
            builder.SslMode = SslMode.Require;
        }
    }

    private static string GetRequiredValue(IConfiguration configuration, string key)
    {
        return configuration[key]
            ?? throw new InvalidOperationException($"{key} is required when POSTGRES_HOST is configured.");
    }

    private static int GetPort(string? value)
    {
        return int.TryParse(value, out var port) ? port : 5432;
    }
}