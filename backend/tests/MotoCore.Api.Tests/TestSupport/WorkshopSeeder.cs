using MotoCore.Domain.Auth;
using MotoCore.Domain.Workshops;
using MotoCore.Infrastructure.Persistence;

namespace MotoCore.Api.Tests.TestSupport;

public static class WorkshopSeeder
{
    public static async Task<Workshop> SeedWorkshopAsync(
        MotoCoreDbContext context,
        Guid ownerId,
        string name = "Test Workshop")
    {
        var workshop = new Workshop
        {
            Name = name,
            OwnerId = ownerId,
            IsActive = true,
        };

        context.Workshops.Add(workshop);
        await context.SaveChangesAsync();

        return workshop;
    }

    public static async Task<WorkshopMembership> SeedMembershipAsync(
        MotoCoreDbContext context,
        Guid workshopId,
        Guid userId,
        string role = SystemRoles.Owner,
        bool isActive = true)
    {
        await EnsureUserAccountAsync(context, userId, role);

        var membership = new WorkshopMembership
        {
            WorkshopId = workshopId,
            UserAccountId = userId,
            Role = role,
            IsActive = isActive,
        };

        context.WorkshopMemberships.Add(membership);
        await context.SaveChangesAsync();

        return membership;
    }

    private static async Task EnsureUserAccountAsync(MotoCoreDbContext context, Guid userId, string role)
    {
        var existing = await context.Users.FindAsync(userId);
        if (existing is not null)
        {
            return;
        }

        var normalizedEmail = $"{userId}@test.local".ToUpperInvariant();

        var user = new UserAccount
        {
            Id = userId,
            Email = $"{userId}@test.local",
            NormalizedEmail = normalizedEmail,
            PasswordHash = "test-hash",
            FirstName = "Test",
            LastName = "User",
            Role = role,
            EmailConfirmed = true,
        };

        context.Users.Add(user);
        await context.SaveChangesAsync();
    }

    public static async Task<(Workshop Workshop, WorkshopMembership Membership)> SeedWorkshopWithMemberAsync(
        MotoCoreDbContext context,
        Guid userId,
        string role = SystemRoles.Owner,
        string name = "Test Workshop")
    {
        var workshop = await SeedWorkshopAsync(context, userId, name);
        var membership = await SeedMembershipAsync(context, workshop.Id, userId, role);

        return (workshop, membership);
    }
}
