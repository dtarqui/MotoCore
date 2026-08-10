using MotoCore.Api.Tests.TestSupport;
using MotoCore.Application.Audit.Services;
using MotoCore.Application.Clients.Models;
using MotoCore.Application.Clients.Services;
using MotoCore.Application.Motorcycles.Models;
using MotoCore.Application.Motorcycles.Services;
using MotoCore.Domain.Auth;
using MotoCore.Infrastructure.Persistence;

namespace MotoCore.Api.Tests.Motorcycles;

public class MotorcycleServiceTests
{
    private static MotorcycleService CreateService(MotoCoreDbContext context) =>
        new(new MotorcycleRepository(context), new WorkshopRepository(context), new ClientRepository(context), CreateAuditLogService(context));

    private static ClientService CreateClientService(MotoCoreDbContext context) =>
        new(new ClientRepository(context), new WorkshopRepository(context), CreateAuditLogService(context));

    private static AuditLogService CreateAuditLogService(MotoCoreDbContext context) =>
        new(new AuditLogRepository(context), new WorkshopRepository(context));

    private static CreateClientRequest BuildClientRequest(string email = "cliente@test.com") =>
        new("Ana", "Gomez", email, "555-0000", null, null, null, null, null, null, null, null, null, null);

    private static CreateMotorcycleRequest BuildCreateRequest(Guid clientId, string plate = "ABC-123") =>
        new(clientId, "Honda", "CB190R", 2023, plate, null, null, null, null, null);

    private static UpdateMotorcycleRequest BuildUpdateRequest(string plate = "ABC-123") =>
        new("Yamaha", "FZ25", 2024, plate, null, "Rojo", 5000, null, null);

    [Fact]
    public async Task CreateMotorcycleAsync_Succeeds_ForReceptionist()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var receptionistId = Guid.NewGuid();
        var (workshop, _) = await WorkshopSeeder.SeedWorkshopWithMemberAsync(context, receptionistId, SystemRoles.Receptionist);
        var clientService = CreateClientService(context);
        var client = await clientService.CreateClientAsync(workshop.Id, receptionistId, BuildClientRequest());
        var service = CreateService(context);

        var result = await service.CreateMotorcycleAsync(workshop.Id, receptionistId, BuildCreateRequest(client.Value!.Id));

        Assert.True(result.IsSuccess);
        Assert.Equal("ABC-123", result.Value!.LicensePlate);
    }

    [Fact]
    public async Task CreateMotorcycleAsync_Fails_ForMechanicRole()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var mechanicId = Guid.NewGuid();
        var (workshop, _) = await WorkshopSeeder.SeedWorkshopWithMemberAsync(context, mechanicId, SystemRoles.Mechanic);
        var service = CreateService(context);

        var result = await service.CreateMotorcycleAsync(workshop.Id, mechanicId, BuildCreateRequest(Guid.NewGuid()));

        Assert.False(result.IsSuccess);
        Assert.Equal("motorcycle.insufficient_permissions", result.Error!.Code);
    }

    [Fact]
    public async Task CreateMotorcycleAsync_Fails_WhenClientNotFound()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var ownerId = Guid.NewGuid();
        var (workshop, _) = await WorkshopSeeder.SeedWorkshopWithMemberAsync(context, ownerId, SystemRoles.Owner);
        var service = CreateService(context);

        var result = await service.CreateMotorcycleAsync(workshop.Id, ownerId, BuildCreateRequest(Guid.NewGuid()));

        Assert.False(result.IsSuccess);
        Assert.Equal("motorcycle.client_not_found", result.Error!.Code);
    }

    [Fact]
    public async Task CreateMotorcycleAsync_Fails_WhenLicensePlateAlreadyExists()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var ownerId = Guid.NewGuid();
        var (workshop, _) = await WorkshopSeeder.SeedWorkshopWithMemberAsync(context, ownerId, SystemRoles.Owner);
        var clientService = CreateClientService(context);
        var client = await clientService.CreateClientAsync(workshop.Id, ownerId, BuildClientRequest());
        var service = CreateService(context);

        await service.CreateMotorcycleAsync(workshop.Id, ownerId, BuildCreateRequest(client.Value!.Id, "DUP-001"));
        var result = await service.CreateMotorcycleAsync(workshop.Id, ownerId, BuildCreateRequest(client.Value.Id, "dup-001"));

        Assert.False(result.IsSuccess);
        Assert.Equal("motorcycle.license_plate_exists", result.Error!.Code);
    }

    [Fact]
    public async Task GetMotorcycleByIdAsync_Fails_ForWrongWorkshop()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var ownerAId = Guid.NewGuid();
        var (workshopA, _) = await WorkshopSeeder.SeedWorkshopWithMemberAsync(context, ownerAId, SystemRoles.Owner, "Workshop A");
        var clientService = CreateClientService(context);
        var client = await clientService.CreateClientAsync(workshopA.Id, ownerAId, BuildClientRequest());
        var service = CreateService(context);
        var motorcycle = await service.CreateMotorcycleAsync(workshopA.Id, ownerAId, BuildCreateRequest(client.Value!.Id));

        var ownerBId = Guid.NewGuid();
        var (workshopB, _) = await WorkshopSeeder.SeedWorkshopWithMemberAsync(context, ownerBId, SystemRoles.Owner, "Workshop B");

        var result = await service.GetMotorcycleByIdAsync(workshopB.Id, motorcycle.Value!.Id, ownerBId);

        Assert.False(result.IsSuccess);
        Assert.Equal("motorcycle.workshop_mismatch", result.Error!.Code);
    }

    [Fact]
    public async Task GetClientMotorcyclesAsync_ReturnsOnlyThatClientsMotorcycles()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var ownerId = Guid.NewGuid();
        var (workshop, _) = await WorkshopSeeder.SeedWorkshopWithMemberAsync(context, ownerId, SystemRoles.Owner);
        var clientService = CreateClientService(context);
        var clientA = await clientService.CreateClientAsync(workshop.Id, ownerId, BuildClientRequest("a@test.com"));
        var clientB = await clientService.CreateClientAsync(workshop.Id, ownerId, BuildClientRequest("b@test.com"));
        var service = CreateService(context);
        await service.CreateMotorcycleAsync(workshop.Id, ownerId, BuildCreateRequest(clientA.Value!.Id, "AAA-111"));
        await service.CreateMotorcycleAsync(workshop.Id, ownerId, BuildCreateRequest(clientB.Value!.Id, "BBB-222"));

        var result = await service.GetClientMotorcyclesAsync(workshop.Id, clientA.Value.Id, ownerId);

        Assert.True(result.IsSuccess);
        Assert.Single(result.Value!);
        Assert.Equal("AAA-111", result.Value![0].LicensePlate);
    }

    [Fact]
    public async Task UpdateMotorcycleAsync_Succeeds_AndPersistsChanges()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var ownerId = Guid.NewGuid();
        var (workshop, _) = await WorkshopSeeder.SeedWorkshopWithMemberAsync(context, ownerId, SystemRoles.Owner);
        var clientService = CreateClientService(context);
        var client = await clientService.CreateClientAsync(workshop.Id, ownerId, BuildClientRequest());
        var service = CreateService(context);
        var created = await service.CreateMotorcycleAsync(workshop.Id, ownerId, BuildCreateRequest(client.Value!.Id));

        var result = await service.UpdateMotorcycleAsync(workshop.Id, created.Value!.Id, ownerId, BuildUpdateRequest());

        Assert.True(result.IsSuccess);
        Assert.Equal("Yamaha", result.Value!.Brand);
        Assert.Equal(5000, result.Value.Mileage);
    }

    [Fact]
    public async Task DeleteMotorcycleAsync_RejectsReceptionist_EvenThoughReceptionistCanCreateAndUpdate()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var receptionistId = Guid.NewGuid();
        var (workshop, _) = await WorkshopSeeder.SeedWorkshopWithMemberAsync(context, receptionistId, SystemRoles.Receptionist);
        var clientService = CreateClientService(context);
        var client = await clientService.CreateClientAsync(workshop.Id, receptionistId, BuildClientRequest());
        var service = CreateService(context);
        var created = await service.CreateMotorcycleAsync(workshop.Id, receptionistId, BuildCreateRequest(client.Value!.Id));
        Assert.True(created.IsSuccess);

        var updated = await service.UpdateMotorcycleAsync(workshop.Id, created.Value!.Id, receptionistId, BuildUpdateRequest());
        Assert.True(updated.IsSuccess);

        var deleteResult = await service.DeleteMotorcycleAsync(workshop.Id, created.Value.Id, receptionistId);

        Assert.False(deleteResult.IsSuccess);
        Assert.Equal("motorcycle.insufficient_permissions", deleteResult.Error!.Code);
    }

    [Fact]
    public async Task GetWorkshopMotorcyclesPagedAsync_ReturnsCorrectPageAndTotalCount()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var ownerId = Guid.NewGuid();
        var (workshop, _) = await WorkshopSeeder.SeedWorkshopWithMemberAsync(context, ownerId, SystemRoles.Owner);
        var clientService = CreateClientService(context);
        var client = await clientService.CreateClientAsync(workshop.Id, ownerId, BuildClientRequest());
        var service = CreateService(context);
        for (var i = 0; i < 3; i++)
        {
            await service.CreateMotorcycleAsync(workshop.Id, ownerId, BuildCreateRequest(client.Value!.Id, $"PLT-{i:D3}"));
        }

        var result = await service.GetWorkshopMotorcyclesPagedAsync(workshop.Id, ownerId, page: 1, pageSize: 2);

        Assert.True(result.IsSuccess);
        Assert.Equal(2, result.Value!.Items.Count);
        Assert.Equal(3, result.Value.TotalCount);
    }

    [Fact]
    public async Task GetWorkshopMotorcyclesPagedAsync_ReturnsEmptyItems_WhenPageOutOfRange()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var ownerId = Guid.NewGuid();
        var (workshop, _) = await WorkshopSeeder.SeedWorkshopWithMemberAsync(context, ownerId, SystemRoles.Owner);
        var service = CreateService(context);

        var result = await service.GetWorkshopMotorcyclesPagedAsync(workshop.Id, ownerId, page: 5, pageSize: 20);

        Assert.True(result.IsSuccess);
        Assert.Empty(result.Value!.Items);
        Assert.Equal(0, result.Value.TotalCount);
    }

    [Fact]
    public async Task DeleteMotorcycleAsync_SoftDeletes_AndRecordsAuditLog_ForOwner()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var ownerId = Guid.NewGuid();
        var (workshop, _) = await WorkshopSeeder.SeedWorkshopWithMemberAsync(context, ownerId, SystemRoles.Owner);
        var clientService = CreateClientService(context);
        var client = await clientService.CreateClientAsync(workshop.Id, ownerId, BuildClientRequest());
        var service = CreateService(context);
        var created = await service.CreateMotorcycleAsync(workshop.Id, ownerId, BuildCreateRequest(client.Value!.Id));

        var result = await service.DeleteMotorcycleAsync(workshop.Id, created.Value!.Id, ownerId);

        Assert.True(result.IsSuccess);

        var stillExists = await context.Motorcycles.FindAsync(created.Value.Id);
        Assert.NotNull(stillExists);
        Assert.False(stillExists!.IsActive);

        var auditLog = await CreateAuditLogService(context).GetWorkshopAuditLogAsync(workshop.Id, ownerId);
        Assert.Contains(auditLog.Value!, entry => entry.Action == "motorcycle.deleted" && entry.EntityId == created.Value.Id);
    }
}
