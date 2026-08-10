using MotoCore.Api.Tests.TestSupport;
using MotoCore.Application.Audit.Services;
using MotoCore.Application.Clients.Models;
using MotoCore.Application.Clients.Services;
using MotoCore.Domain.Auth;
using MotoCore.Infrastructure.Persistence;

namespace MotoCore.Api.Tests.Clients;

public class ClientServiceTests
{
    private static ClientService CreateService(MotoCoreDbContext context) =>
        new(new ClientRepository(context), new WorkshopRepository(context), CreateAuditLogService(context));

    private static AuditLogService CreateAuditLogService(MotoCoreDbContext context) =>
        new(new AuditLogRepository(context), new WorkshopRepository(context));

    private static CreateClientRequest BuildCreateRequest(string email = "juan@test.com") =>
        new("Juan", "Perez", email, "555-0100", null, null, null, null, null, null, null, null, null, null);

    private static UpdateClientRequest BuildUpdateRequest(string email = "juan@test.com") =>
        new("Juan Actualizado", "Perez", email, "555-0200", null, null, null, null, null, null, null, null, null, null);

    [Fact]
    public async Task CreateClientAsync_Succeeds_ForOwner()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var ownerId = Guid.NewGuid();
        var (workshop, _) = await WorkshopSeeder.SeedWorkshopWithMemberAsync(context, ownerId, SystemRoles.Owner);
        var service = CreateService(context);

        var result = await service.CreateClientAsync(workshop.Id, ownerId, BuildCreateRequest());

        Assert.True(result.IsSuccess);
        Assert.Equal("JUAN@TEST.COM", result.Value!.Email);
        Assert.True(result.Value.IsActive);
    }

    [Fact]
    public async Task CreateClientAsync_Fails_ForMechanicRole()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var mechanicId = Guid.NewGuid();
        var (workshop, _) = await WorkshopSeeder.SeedWorkshopWithMemberAsync(context, mechanicId, SystemRoles.Mechanic);
        var service = CreateService(context);

        var result = await service.CreateClientAsync(workshop.Id, mechanicId, BuildCreateRequest());

        Assert.False(result.IsSuccess);
        Assert.Equal("client.insufficient_permissions", result.Error!.Code);
    }

    [Fact]
    public async Task CreateClientAsync_Fails_WhenEmailAlreadyExistsInWorkshop()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var ownerId = Guid.NewGuid();
        var (workshop, _) = await WorkshopSeeder.SeedWorkshopWithMemberAsync(context, ownerId, SystemRoles.Owner);
        var service = CreateService(context);

        await service.CreateClientAsync(workshop.Id, ownerId, BuildCreateRequest("dup@test.com"));
        var result = await service.CreateClientAsync(workshop.Id, ownerId, BuildCreateRequest("DUP@test.com"));

        Assert.False(result.IsSuccess);
        Assert.Equal("client.email_already_exists", result.Error!.Code);
    }

    [Fact]
    public async Task GetClientByIdAsync_Fails_ForNonexistentClient()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var ownerId = Guid.NewGuid();
        var (workshop, _) = await WorkshopSeeder.SeedWorkshopWithMemberAsync(context, ownerId, SystemRoles.Owner);
        var service = CreateService(context);

        var result = await service.GetClientByIdAsync(workshop.Id, Guid.NewGuid(), ownerId);

        Assert.False(result.IsSuccess);
        Assert.Equal("client.not_found", result.Error!.Code);
    }

    [Fact]
    public async Task GetWorkshopClientsAsync_Fails_ForUserWithoutMembership()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var ownerId = Guid.NewGuid();
        var (workshop, _) = await WorkshopSeeder.SeedWorkshopWithMemberAsync(context, ownerId, SystemRoles.Owner);
        var service = CreateService(context);

        var result = await service.GetWorkshopClientsAsync(workshop.Id, Guid.NewGuid());

        Assert.False(result.IsSuccess);
        Assert.Equal("client.access_denied", result.Error!.Code);
    }

    [Fact]
    public async Task SearchClientsAsync_Fails_ForBlankSearchTerm()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var ownerId = Guid.NewGuid();
        var (workshop, _) = await WorkshopSeeder.SeedWorkshopWithMemberAsync(context, ownerId, SystemRoles.Owner);
        var service = CreateService(context);

        var result = await service.SearchClientsAsync(workshop.Id, "   ", ownerId);

        Assert.False(result.IsSuccess);
        Assert.Equal("client.invalid_search_term", result.Error!.Code);
    }

    [Fact]
    public async Task SearchClientsAsync_FindsClient_ByPartialName()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var ownerId = Guid.NewGuid();
        var (workshop, _) = await WorkshopSeeder.SeedWorkshopWithMemberAsync(context, ownerId, SystemRoles.Owner);
        var service = CreateService(context);
        await service.CreateClientAsync(workshop.Id, ownerId, BuildCreateRequest());

        var result = await service.SearchClientsAsync(workshop.Id, "Juan", ownerId);

        Assert.True(result.IsSuccess);
        Assert.Single(result.Value!);
    }

    [Fact]
    public async Task UpdateClientAsync_Succeeds_AndPersistsChanges()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var ownerId = Guid.NewGuid();
        var (workshop, _) = await WorkshopSeeder.SeedWorkshopWithMemberAsync(context, ownerId, SystemRoles.Owner);
        var service = CreateService(context);
        var created = await service.CreateClientAsync(workshop.Id, ownerId, BuildCreateRequest());

        var result = await service.UpdateClientAsync(workshop.Id, created.Value!.Id, ownerId, BuildUpdateRequest());

        Assert.True(result.IsSuccess);
        Assert.Equal("Juan Actualizado", result.Value!.FirstName);
        Assert.Equal("555-0200", result.Value.Phone);
    }

    [Fact]
    public async Task UpdateClientAsync_Fails_ForReceptionistChangingToExistingEmail()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var receptionistId = Guid.NewGuid();
        var (workshop, _) = await WorkshopSeeder.SeedWorkshopWithMemberAsync(context, receptionistId, SystemRoles.Receptionist);
        var service = CreateService(context);
        await service.CreateClientAsync(workshop.Id, receptionistId, BuildCreateRequest("taken@test.com"));
        var second = await service.CreateClientAsync(workshop.Id, receptionistId, BuildCreateRequest("second@test.com"));

        var result = await service.UpdateClientAsync(
            workshop.Id, second.Value!.Id, receptionistId, BuildUpdateRequest("taken@test.com"));

        Assert.False(result.IsSuccess);
        Assert.Equal("client.email_already_exists", result.Error!.Code);
    }

    [Fact]
    public async Task DeleteClientAsync_SoftDeletes_AndRecordsAuditLog()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var ownerId = Guid.NewGuid();
        var (workshop, _) = await WorkshopSeeder.SeedWorkshopWithMemberAsync(context, ownerId, SystemRoles.Owner);
        var service = CreateService(context);
        var created = await service.CreateClientAsync(workshop.Id, ownerId, BuildCreateRequest());

        var result = await service.DeleteClientAsync(workshop.Id, created.Value!.Id, ownerId);

        Assert.True(result.IsSuccess);

        var stillExists = await context.Clients.FindAsync(created.Value.Id);
        Assert.NotNull(stillExists);
        Assert.False(stillExists!.IsActive);

        var auditLog = await new AuditLogService(new AuditLogRepository(context), new WorkshopRepository(context))
            .GetWorkshopAuditLogAsync(workshop.Id, ownerId);
        Assert.True(auditLog.IsSuccess);
        Assert.Contains(auditLog.Value!, entry => entry.Action == "client.deleted" && entry.EntityId == created.Value.Id);
    }

    [Fact]
    public async Task DeleteClientAsync_Fails_ForMechanicRole()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var ownerId = Guid.NewGuid();
        var (workshop, _) = await WorkshopSeeder.SeedWorkshopWithMemberAsync(context, ownerId, SystemRoles.Owner);
        var service = CreateService(context);
        var created = await service.CreateClientAsync(workshop.Id, ownerId, BuildCreateRequest());

        var mechanicId = Guid.NewGuid();
        await WorkshopSeeder.SeedMembershipAsync(context, workshop.Id, mechanicId, SystemRoles.Mechanic);

        var result = await service.DeleteClientAsync(workshop.Id, created.Value!.Id, mechanicId);

        Assert.False(result.IsSuccess);
        Assert.Equal("client.insufficient_permissions", result.Error!.Code);
    }

    [Fact]
    public async Task GetClientSummaryAsync_Succeeds_ForExistingClient()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var ownerId = Guid.NewGuid();
        var (workshop, _) = await WorkshopSeeder.SeedWorkshopWithMemberAsync(context, ownerId, SystemRoles.Owner);
        var service = CreateService(context);
        var created = await service.CreateClientAsync(workshop.Id, ownerId, BuildCreateRequest());

        var result = await service.GetClientSummaryAsync(workshop.Id, created.Value!.Id, ownerId);

        Assert.True(result.IsSuccess);
        Assert.Equal("Juan Perez", result.Value!.FullName);
    }

    [Fact]
    public async Task GetWorkshopClientsPagedAsync_ReturnsCorrectPageAndTotalCount()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var ownerId = Guid.NewGuid();
        var (workshop, _) = await WorkshopSeeder.SeedWorkshopWithMemberAsync(context, ownerId, SystemRoles.Owner);
        var service = CreateService(context);
        for (var i = 0; i < 5; i++)
        {
            await service.CreateClientAsync(workshop.Id, ownerId, BuildCreateRequest($"client{i}@test.com"));
        }

        var result = await service.GetWorkshopClientsPagedAsync(workshop.Id, ownerId, page: 1, pageSize: 2);

        Assert.True(result.IsSuccess);
        Assert.Equal(2, result.Value!.Items.Count);
        Assert.Equal(5, result.Value.TotalCount);
        Assert.Equal(1, result.Value.Page);
        Assert.Equal(2, result.Value.PageSize);
    }

    [Fact]
    public async Task GetWorkshopClientsPagedAsync_ReturnsEmptyItems_ButCorrectTotalCount_WhenPageOutOfRange()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var ownerId = Guid.NewGuid();
        var (workshop, _) = await WorkshopSeeder.SeedWorkshopWithMemberAsync(context, ownerId, SystemRoles.Owner);
        var service = CreateService(context);
        await service.CreateClientAsync(workshop.Id, ownerId, BuildCreateRequest());

        var result = await service.GetWorkshopClientsPagedAsync(workshop.Id, ownerId, page: 99, pageSize: 20);

        Assert.True(result.IsSuccess);
        Assert.Empty(result.Value!.Items);
        Assert.Equal(1, result.Value.TotalCount);
    }

    [Fact]
    public async Task GetWorkshopClientsPagedAsync_ClampsPageSize_ToMaximumOf100()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var ownerId = Guid.NewGuid();
        var (workshop, _) = await WorkshopSeeder.SeedWorkshopWithMemberAsync(context, ownerId, SystemRoles.Owner);
        var service = CreateService(context);

        var result = await service.GetWorkshopClientsPagedAsync(workshop.Id, ownerId, page: 1, pageSize: 1000);

        Assert.True(result.IsSuccess);
        Assert.Equal(100, result.Value!.PageSize);
    }

    [Fact]
    public async Task GetWorkshopClientsAsync_Unpaginated_IsUnaffectedByPagedMethodExisting()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var ownerId = Guid.NewGuid();
        var (workshop, _) = await WorkshopSeeder.SeedWorkshopWithMemberAsync(context, ownerId, SystemRoles.Owner);
        var service = CreateService(context);
        await service.CreateClientAsync(workshop.Id, ownerId, BuildCreateRequest("a@test.com"));
        await service.CreateClientAsync(workshop.Id, ownerId, BuildCreateRequest("b@test.com"));

        var result = await service.GetWorkshopClientsAsync(workshop.Id, ownerId);

        Assert.True(result.IsSuccess);
        Assert.Equal(2, result.Value!.Count);
    }

    [Fact]
    public async Task GetClientStatisticsAsync_ReflectsCreatedClients()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var ownerId = Guid.NewGuid();
        var (workshop, _) = await WorkshopSeeder.SeedWorkshopWithMemberAsync(context, ownerId, SystemRoles.Owner);
        var service = CreateService(context);
        await service.CreateClientAsync(workshop.Id, ownerId, BuildCreateRequest("a@test.com"));
        await service.CreateClientAsync(workshop.Id, ownerId, BuildCreateRequest("b@test.com"));

        var result = await service.GetClientStatisticsAsync(workshop.Id, ownerId);

        Assert.True(result.IsSuccess);
        Assert.Equal(2, result.Value!.TotalClients);
        Assert.Equal(2, result.Value.ActiveClients);
    }
}
