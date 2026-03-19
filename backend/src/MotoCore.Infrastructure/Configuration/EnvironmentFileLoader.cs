namespace MotoCore.Infrastructure.Configuration;

public static class EnvironmentFileLoader
{
    public static void LoadFromStandardLocations(params string[] startDirectories)
    {
        foreach (var directory in startDirectories.Where(static value => !string.IsNullOrWhiteSpace(value)))
        {
            var envFilePath = FindEnvFile(directory);
            if (envFilePath is null)
            {
                continue;
            }

            LoadFile(envFilePath);
            return;
        }
    }

    private static string? FindEnvFile(string startDirectory)
    {
        var directoryInfo = new DirectoryInfo(Path.GetFullPath(startDirectory));

        while (directoryInfo is not null)
        {
            var envFilePath = Path.Combine(directoryInfo.FullName, ".env");
            if (File.Exists(envFilePath))
            {
                return envFilePath;
            }

            directoryInfo = directoryInfo.Parent;
        }

        return null;
    }

    private static void LoadFile(string envFilePath)
    {
        foreach (var rawLine in File.ReadLines(envFilePath))
        {
            var line = rawLine.Trim();
            if (string.IsNullOrWhiteSpace(line) || line.StartsWith('#'))
            {
                continue;
            }

            var separatorIndex = line.IndexOf('=');
            if (separatorIndex <= 0)
            {
                continue;
            }

            var key = line[..separatorIndex].Trim();
            if (string.IsNullOrWhiteSpace(key) || Environment.GetEnvironmentVariable(key) is not null)
            {
                continue;
            }

            var value = line[(separatorIndex + 1)..].Trim();
            Environment.SetEnvironmentVariable(key, TrimQuotes(value));
        }
    }

    private static string TrimQuotes(string value)
    {
        if (value.Length >= 2)
        {
            var first = value[0];
            var last = value[^1];

            if ((first == '"' && last == '"') || (first == '\'' && last == '\''))
            {
                return value[1..^1];
            }
        }

        return value;
    }
}