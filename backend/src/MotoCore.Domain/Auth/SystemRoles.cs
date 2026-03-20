namespace MotoCore.Domain.Auth;

public static class SystemRoles
{
    public const string Owner = "Owner";
    public const string Mechanic = "Mechanic";
    public const string Receptionist = "Receptionist";

    public static readonly IReadOnlyCollection<string> All =
    [
        Owner,
        Mechanic,
        Receptionist,
    ];

    public static bool IsSupported(string role) =>
        All.Contains(role, StringComparer.OrdinalIgnoreCase);

    public static bool CanInviteMembers(string role) =>
        role.Equals(Owner, StringComparison.OrdinalIgnoreCase);

    public static bool IsOwner(string role) =>
        role.Equals(Owner, StringComparison.OrdinalIgnoreCase);
}