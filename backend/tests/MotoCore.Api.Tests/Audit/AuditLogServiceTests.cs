using MotoCore.Api.Tests.TestSupport;
using MotoCore.Application.Audit.Services;
using MotoCore.Domain.Auth;
using MotoCore.Infrastructure.Persistence;

namespace MotoCore.Api.Tests.Audit;

public class AuditLogServiceTests
{
    private static AuditLogService CreateService(MotoCoreDbContext context) =>
        new(new AuditLogRepository(context), new WorkshopRepository(context));

    [Fact]
    public async Task LogAsync_PersistsEntry_RetrievableByOwner()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var ownerId = Guid.NewGuid();
        var (workshop, _) = await WorkshopSeeder.SeedWorkshopWithMemberAsync(context, ownerId, SystemRoles.Owner);
        var service = CreateService(context);

        await service.LogAsync(workshop.Id, ownerId, "workshop.member_removed", "WorkshopMembership", Guid.NewGuid(), "test details");

        var result = await service.GetWorkshopAuditLogAsync(workshop.Id, ownerId);

        Assert.True(result.IsSuccess);
        Assert.Single(result.Value!);
        Assert.Equal("workshop.member_removed", result.Value![0].Action);
    }

    [Fact]
    public async Task GetWorkshopAuditLogAsync_Fails_ForNonOwnerRole()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var receptionistId = Guid.NewGuid();
        var (workshop, _) = await WorkshopSeeder.SeedWorkshopWithMemberAsync(context, receptionistId, SystemRoles.Receptionist);
        var service = CreateService(context);

        var result = await service.GetWorkshopAuditLogAsync(workshop.Id, receptionistId);

        Assert.False(result.IsSuccess);
        Assert.Equal("audit.insufficient_permissions", result.Error!.Code);
    }
}
