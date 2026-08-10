using MotoCore.Api.Tests.TestSupport;
using MotoCore.Application.Audit.Services;
using MotoCore.Application.Workshops.Models;
using MotoCore.Application.Workshops.Services;
using MotoCore.Domain.Auth;
using MotoCore.Infrastructure.Persistence;

namespace MotoCore.Api.Tests.Workshops;

public class WorkshopServiceTests
{
    private static WorkshopService CreateService(MotoCoreDbContext context) =>
        new(new WorkshopRepository(context), new UserIdentityRepository(context), CreateAuditLogService(context));

    private static AuditLogService CreateAuditLogService(MotoCoreDbContext context) =>
        new(new AuditLogRepository(context), new WorkshopRepository(context));

    private static async Task<UserAccount> SeedUserAsync(MotoCoreDbContext context, string email)
    {
        var user = new UserAccount
        {
            Email = email,
            NormalizedEmail = email.ToUpperInvariant(),
            PasswordHash = "test-hash",
            FirstName = "Test",
            LastName = "User",
            Role = SystemRoles.Receptionist,
            EmailConfirmed = true,
        };

        context.Users.Add(user);
        await context.SaveChangesAsync();

        return user;
    }

    private static CreateWorkshopRequest BuildCreateRequest(string name = "Taller Test") =>
        new(name, null, null, null, null);

    [Fact]
    public async Task CreateWorkshopAsync_Succeeds_AndCreatesOwnerMembership()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var owner = await SeedUserAsync(context, "owner@test.com");
        var service = CreateService(context);

        var result = await service.CreateWorkshopAsync(owner.Id, BuildCreateRequest());

        Assert.True(result.IsSuccess);
        Assert.Equal(owner.Id, result.Value!.OwnerId);
    }

    [Fact]
    public async Task CreateWorkshopAsync_Fails_ForBlankName()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var owner = await SeedUserAsync(context, "owner@test.com");
        var service = CreateService(context);

        var result = await service.CreateWorkshopAsync(owner.Id, BuildCreateRequest("   "));

        Assert.False(result.IsSuccess);
        Assert.Equal("workshop.invalid_name", result.Error!.Code);
    }

    [Fact]
    public async Task CreateWorkshopAsync_Fails_WhenOwnerNotFound()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var service = CreateService(context);

        var result = await service.CreateWorkshopAsync(Guid.NewGuid(), BuildCreateRequest());

        Assert.False(result.IsSuccess);
        Assert.Equal("workshop.owner_not_found", result.Error!.Code);
    }

    [Fact]
    public async Task GetWorkshopByIdAsync_Fails_ForUserWithoutMembership()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var ownerId = Guid.NewGuid();
        var (workshop, _) = await WorkshopSeeder.SeedWorkshopWithMemberAsync(context, ownerId, SystemRoles.Owner);
        var service = CreateService(context);

        var result = await service.GetWorkshopByIdAsync(workshop.Id, Guid.NewGuid());

        Assert.False(result.IsSuccess);
        Assert.Equal("workshop.access_denied", result.Error!.Code);
    }

    [Fact]
    public async Task GetUserWorkshopsAsync_ReturnsWorkshopsOwnedByUser()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var ownerId = Guid.NewGuid();
        await WorkshopSeeder.SeedWorkshopWithMemberAsync(context, ownerId, SystemRoles.Owner, "Taller 1");
        var service = CreateService(context);

        var result = await service.GetUserWorkshopsAsync(ownerId);

        Assert.True(result.IsSuccess);
        Assert.Single(result.Value!);
    }

    [Fact]
    public async Task UpdateWorkshopAsync_Fails_ForNonOwner()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var ownerId = Guid.NewGuid();
        var (workshop, _) = await WorkshopSeeder.SeedWorkshopWithMemberAsync(context, ownerId, SystemRoles.Owner);
        var service = CreateService(context);

        var result = await service.UpdateWorkshopAsync(
            workshop.Id, Guid.NewGuid(), new UpdateWorkshopRequest("Nuevo Nombre", null, null, null, null));

        Assert.False(result.IsSuccess);
        Assert.Equal("workshop.access_denied", result.Error!.Code);
    }

    [Fact]
    public async Task UpdateWorkshopAsync_Fails_ForBlankName()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var ownerId = Guid.NewGuid();
        var (workshop, _) = await WorkshopSeeder.SeedWorkshopWithMemberAsync(context, ownerId, SystemRoles.Owner);
        var service = CreateService(context);

        var result = await service.UpdateWorkshopAsync(
            workshop.Id, ownerId, new UpdateWorkshopRequest("", null, null, null, null));

        Assert.False(result.IsSuccess);
        Assert.Equal("workshop.invalid_name", result.Error!.Code);
    }

    [Fact]
    public async Task DeleteWorkshopAsync_Fails_ForNonOwner()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var ownerId = Guid.NewGuid();
        var (workshop, _) = await WorkshopSeeder.SeedWorkshopWithMemberAsync(context, ownerId, SystemRoles.Owner);
        var service = CreateService(context);

        var result = await service.DeleteWorkshopAsync(workshop.Id, Guid.NewGuid());

        Assert.False(result.IsSuccess);
        Assert.Equal("workshop.access_denied", result.Error!.Code);
    }

    [Fact]
    public async Task DeleteWorkshopAsync_Succeeds_AndRecordsAuditLog()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var ownerId = Guid.NewGuid();
        var (workshop, _) = await WorkshopSeeder.SeedWorkshopWithMemberAsync(context, ownerId, SystemRoles.Owner);
        var service = CreateService(context);

        var result = await service.DeleteWorkshopAsync(workshop.Id, ownerId);

        Assert.True(result.IsSuccess);

        var auditRepo = new AuditLogRepository(context);
        var entries = await auditRepo.GetByWorkshopIdAsync(workshop.Id);
        Assert.Contains(entries, e => e.Action == "workshop.deleted");
    }

    [Fact]
    public async Task InviteUserToWorkshopAsync_Fails_ForNonOwnerInviter()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var receptionistId = Guid.NewGuid();
        var (workshop, _) = await WorkshopSeeder.SeedWorkshopWithMemberAsync(context, receptionistId, SystemRoles.Receptionist);
        var target = await SeedUserAsync(context, "target@test.com");
        var service = CreateService(context);

        var result = await service.InviteUserToWorkshopAsync(
            workshop.Id, receptionistId, new InviteUserRequest(target.Email, SystemRoles.Mechanic));

        Assert.False(result.IsSuccess);
        Assert.Equal("workshop.insufficient_permissions", result.Error!.Code);
    }

    [Fact]
    public async Task InviteUserToWorkshopAsync_Fails_ForOwnerRoleInvitation()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var ownerId = Guid.NewGuid();
        var (workshop, _) = await WorkshopSeeder.SeedWorkshopWithMemberAsync(context, ownerId, SystemRoles.Owner);
        var target = await SeedUserAsync(context, "target@test.com");
        var service = CreateService(context);

        var result = await service.InviteUserToWorkshopAsync(
            workshop.Id, ownerId, new InviteUserRequest(target.Email, SystemRoles.Owner));

        Assert.False(result.IsSuccess);
        Assert.Equal("workshop.invalid_role", result.Error!.Code);
    }

    [Fact]
    public async Task InviteUserToWorkshopAsync_Fails_ForInvalidEmail()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var ownerId = Guid.NewGuid();
        var (workshop, _) = await WorkshopSeeder.SeedWorkshopWithMemberAsync(context, ownerId, SystemRoles.Owner);
        var service = CreateService(context);

        var result = await service.InviteUserToWorkshopAsync(
            workshop.Id, ownerId, new InviteUserRequest("not-an-email", SystemRoles.Mechanic));

        Assert.False(result.IsSuccess);
        Assert.Equal("workshop.invalid_email", result.Error!.Code);
    }

    [Fact]
    public async Task InviteUserToWorkshopAsync_Fails_WhenTargetUserDoesNotExist()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var ownerId = Guid.NewGuid();
        var (workshop, _) = await WorkshopSeeder.SeedWorkshopWithMemberAsync(context, ownerId, SystemRoles.Owner);
        var service = CreateService(context);

        var result = await service.InviteUserToWorkshopAsync(
            workshop.Id, ownerId, new InviteUserRequest("ghost@test.com", SystemRoles.Mechanic));

        Assert.False(result.IsSuccess);
        Assert.Equal("workshop.user_not_found", result.Error!.Code);
    }

    [Fact]
    public async Task InviteUserToWorkshopAsync_Fails_WhenUserAlreadyMember()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var ownerId = Guid.NewGuid();
        var (workshop, _) = await WorkshopSeeder.SeedWorkshopWithMemberAsync(context, ownerId, SystemRoles.Owner);
        var target = await SeedUserAsync(context, "target@test.com");
        await WorkshopSeeder.SeedMembershipAsync(context, workshop.Id, target.Id, SystemRoles.Mechanic);
        var service = CreateService(context);

        var result = await service.InviteUserToWorkshopAsync(
            workshop.Id, ownerId, new InviteUserRequest(target.Email, SystemRoles.Mechanic));

        Assert.False(result.IsSuccess);
        Assert.Equal("workshop.user_already_member", result.Error!.Code);
    }

    [Fact]
    public async Task InviteUserToWorkshopAsync_Succeeds_ForOwnerInvitingValidRole()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var ownerId = Guid.NewGuid();
        var (workshop, _) = await WorkshopSeeder.SeedWorkshopWithMemberAsync(context, ownerId, SystemRoles.Owner);
        var target = await SeedUserAsync(context, "target@test.com");
        var service = CreateService(context);

        var result = await service.InviteUserToWorkshopAsync(
            workshop.Id, ownerId, new InviteUserRequest(target.Email, SystemRoles.Mechanic));

        Assert.True(result.IsSuccess);

        var members = await service.GetWorkshopMembersAsync(workshop.Id, ownerId);
        Assert.Contains(members.Value!, m => m.UserId == target.Id && m.Role == SystemRoles.Mechanic);
    }

    [Fact]
    public async Task RemoveMemberAsync_Fails_ForNonOwnerRequester()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var ownerId = Guid.NewGuid();
        var (workshop, _) = await WorkshopSeeder.SeedWorkshopWithMemberAsync(context, ownerId, SystemRoles.Owner);
        var mechanicId = Guid.NewGuid();
        await WorkshopSeeder.SeedMembershipAsync(context, workshop.Id, mechanicId, SystemRoles.Mechanic);
        var service = CreateService(context);

        var result = await service.RemoveMemberAsync(workshop.Id, mechanicId, mechanicId);

        Assert.False(result.IsSuccess);
        Assert.Equal("workshop.insufficient_permissions", result.Error!.Code);
    }

    [Fact]
    public async Task RemoveMemberAsync_Fails_ForNonexistentMember()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var ownerId = Guid.NewGuid();
        var (workshop, _) = await WorkshopSeeder.SeedWorkshopWithMemberAsync(context, ownerId, SystemRoles.Owner);
        var service = CreateService(context);

        var result = await service.RemoveMemberAsync(workshop.Id, Guid.NewGuid(), ownerId);

        Assert.False(result.IsSuccess);
        Assert.Equal("workshop.member_not_found", result.Error!.Code);
    }

    [Fact]
    public async Task RemoveMemberAsync_Fails_WhenTargetIsOwner()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var ownerId = Guid.NewGuid();
        var (workshop, _) = await WorkshopSeeder.SeedWorkshopWithMemberAsync(context, ownerId, SystemRoles.Owner);
        var service = CreateService(context);

        var result = await service.RemoveMemberAsync(workshop.Id, ownerId, ownerId);

        Assert.False(result.IsSuccess);
        Assert.Equal("workshop.cannot_remove_owner", result.Error!.Code);
    }

    [Fact]
    public async Task RemoveMemberAsync_Succeeds_AndRecordsAuditLog()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var ownerId = Guid.NewGuid();
        var (workshop, _) = await WorkshopSeeder.SeedWorkshopWithMemberAsync(context, ownerId, SystemRoles.Owner);
        var mechanicId = Guid.NewGuid();
        await WorkshopSeeder.SeedMembershipAsync(context, workshop.Id, mechanicId, SystemRoles.Mechanic);
        var service = CreateService(context);

        var result = await service.RemoveMemberAsync(workshop.Id, mechanicId, ownerId);

        Assert.True(result.IsSuccess);

        var auditRepo = new AuditLogRepository(context);
        var entries = await auditRepo.GetByWorkshopIdAsync(workshop.Id);
        Assert.Contains(entries, e => e.Action == "workshop.member_removed");
    }

    [Fact]
    public async Task UpdateMemberRoleAsync_Fails_ForInvalidRole()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var ownerId = Guid.NewGuid();
        var (workshop, _) = await WorkshopSeeder.SeedWorkshopWithMemberAsync(context, ownerId, SystemRoles.Owner);
        var mechanicId = Guid.NewGuid();
        await WorkshopSeeder.SeedMembershipAsync(context, workshop.Id, mechanicId, SystemRoles.Mechanic);
        var service = CreateService(context);

        var result = await service.UpdateMemberRoleAsync(workshop.Id, mechanicId, "NotARole", ownerId);

        Assert.False(result.IsSuccess);
        Assert.Equal("workshop.invalid_role", result.Error!.Code);
    }

    [Fact]
    public async Task UpdateMemberRoleAsync_Fails_WhenTargetIsOwner()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var ownerId = Guid.NewGuid();
        var (workshop, _) = await WorkshopSeeder.SeedWorkshopWithMemberAsync(context, ownerId, SystemRoles.Owner);
        var service = CreateService(context);

        var result = await service.UpdateMemberRoleAsync(workshop.Id, ownerId, SystemRoles.Mechanic, ownerId);

        Assert.False(result.IsSuccess);
        Assert.Equal("workshop.cannot_change_owner_role", result.Error!.Code);
    }

    [Fact]
    public async Task UpdateMemberRoleAsync_Succeeds_AndRecordsAuditLog()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var ownerId = Guid.NewGuid();
        var (workshop, _) = await WorkshopSeeder.SeedWorkshopWithMemberAsync(context, ownerId, SystemRoles.Owner);
        var mechanicId = Guid.NewGuid();
        await WorkshopSeeder.SeedMembershipAsync(context, workshop.Id, mechanicId, SystemRoles.Mechanic);
        var service = CreateService(context);

        var result = await service.UpdateMemberRoleAsync(workshop.Id, mechanicId, SystemRoles.Receptionist, ownerId);

        Assert.True(result.IsSuccess);

        var members = await service.GetWorkshopMembersAsync(workshop.Id, ownerId);
        Assert.Contains(members.Value!, m => m.UserId == mechanicId && m.Role == SystemRoles.Receptionist);

        var auditRepo = new AuditLogRepository(context);
        var entries = await auditRepo.GetByWorkshopIdAsync(workshop.Id);
        Assert.Contains(entries, e => e.Action == "workshop.member_role_changed");
    }
}
