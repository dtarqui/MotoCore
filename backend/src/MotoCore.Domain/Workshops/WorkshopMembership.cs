using MotoCore.Domain.Auth;

namespace MotoCore.Domain.Workshops;

public sealed class WorkshopMembership
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid WorkshopId { get; set; }
    public Guid UserAccountId { get; set; }
    public string Role { get; set; } = SystemRoles.Receptionist;
    public bool IsActive { get; set; } = true;
    public DateTimeOffset JoinedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? UpdatedAtUtc { get; set; }

    public Workshop Workshop { get; set; } = null!;
    public UserAccount UserAccount { get; set; } = null!;
}
