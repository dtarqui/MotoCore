namespace MotoCore.Domain.Auth;

public static class SystemRoles
{
    public const string Administrator = "Administrator";
    public const string Mechanic = "Mechanic";
    public const string Receptionist = "Receptionist";

    public static readonly IReadOnlyCollection<string> All =
    [
        Administrator,
        Mechanic,
        Receptionist,
    ];

    public static bool IsSupported(string role) =>
        All.Contains(role, StringComparer.OrdinalIgnoreCase);
}