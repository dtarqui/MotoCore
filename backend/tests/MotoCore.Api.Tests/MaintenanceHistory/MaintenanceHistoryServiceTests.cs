using MotoCore.Api.Tests.TestSupport;
using MotoCore.Application.Audit.Services;
using MotoCore.Application.Clients.Models;
using MotoCore.Application.Clients.Services;
using MotoCore.Application.MaintenanceHistory.Models;
using MotoCore.Application.MaintenanceHistory.Services;
using MotoCore.Application.Motorcycles.Models;
using MotoCore.Application.Motorcycles.Services;
using MotoCore.Domain.Auth;
using MotoCore.Domain.Workshops;
using MotoCore.Infrastructure.Persistence;

namespace MotoCore.Api.Tests.MaintenanceHistory;

public class MaintenanceHistoryServiceTests
{
    private static MaintenanceHistoryService CreateService(MotoCoreDbContext context) =>
        new(new MaintenanceHistoryRepository(context), new MotorcycleRepository(context), new ClientRepository(context), new WorkshopRepository(context));

    private static ClientService CreateClientService(MotoCoreDbContext context) =>
        new(new ClientRepository(context), new WorkshopRepository(context), CreateAuditLogService(context));

    private static MotorcycleService CreateMotorcycleService(MotoCoreDbContext context) =>
        new(new MotorcycleRepository(context), new WorkshopRepository(context), new ClientRepository(context), CreateAuditLogService(context));

    private static AuditLogService CreateAuditLogService(MotoCoreDbContext context) =>
        new(new AuditLogRepository(context), new WorkshopRepository(context));

    private static CreateClientRequest BuildClientRequest(string email = "cliente@test.com") =>
        new("Ana", "Gomez", email, "555-0000", null, null, null, null, null, null, null, null, null, null);

    private static CreateMotorcycleRequest BuildMotorcycleRequest(Guid clientId, string plate = "ABC-123") =>
        new(clientId, "Honda", "CB190R", 2023, plate, null, null, null, null, null);

    private static CreateMaintenanceHistoryEntryRequest BuildEntryRequest(Guid motorcycleId) =>
        new(motorcycleId, "Cambio de aceite", "Cambio de aceite y filtro", 12000, 50m, DateTimeOffset.UtcNow, "Cambio de aceite", "Filtro de aceite", null, null);

    private static async Task<(Workshop Workshop, Guid MotorcycleId)> SeedWorkshopWithMotorcycleAsync(
        MotoCoreDbContext context, Guid userId, string role = SystemRoles.Owner)
    {
        var (workshop, _) = await WorkshopSeeder.SeedWorkshopWithMemberAsync(context, userId, role);
        var clientService = CreateClientService(context);
        var client = await clientService.CreateClientAsync(workshop.Id, userId, BuildClientRequest());
        var motorcycleService = CreateMotorcycleService(context);
        var motorcycle = await motorcycleService.CreateMotorcycleAsync(workshop.Id, userId, BuildMotorcycleRequest(client.Value!.Id));

        return (workshop, motorcycle.Value!.Id);
    }

    [Fact]
    public async Task CreateMaintenanceHistoryEntryAsync_Succeeds_ForOwner()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var ownerId = Guid.NewGuid();
        var (workshop, motorcycleId) = await SeedWorkshopWithMotorcycleAsync(context, ownerId);
        var service = CreateService(context);

        var result = await service.CreateMaintenanceHistoryEntryAsync(workshop.Id, ownerId, BuildEntryRequest(motorcycleId));

        Assert.True(result.IsSuccess);
        Assert.Equal("Cambio de aceite", result.Value!.Title);
    }

    [Fact]
    public async Task CreateMaintenanceHistoryEntryAsync_Succeeds_ForMechanicRole()
    {
        // Documents real behavior: unlike Clients/Motorcycles/Inventory, this service has
        // no role-based permission check — any active member can create an entry.
        await using var context = InMemoryDbContextFactory.Create();
        var ownerId = Guid.NewGuid();
        var (workshop, motorcycleId) = await SeedWorkshopWithMotorcycleAsync(context, ownerId);
        var mechanicId = Guid.NewGuid();
        await WorkshopSeeder.SeedMembershipAsync(context, workshop.Id, mechanicId, SystemRoles.Mechanic);
        var service = CreateService(context);

        var result = await service.CreateMaintenanceHistoryEntryAsync(workshop.Id, mechanicId, BuildEntryRequest(motorcycleId));

        Assert.True(result.IsSuccess);
    }

    [Fact]
    public async Task CreateMaintenanceHistoryEntryAsync_Fails_ForUserWithoutMembership()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var ownerId = Guid.NewGuid();
        var (workshop, motorcycleId) = await SeedWorkshopWithMotorcycleAsync(context, ownerId);
        var service = CreateService(context);

        var result = await service.CreateMaintenanceHistoryEntryAsync(workshop.Id, Guid.NewGuid(), BuildEntryRequest(motorcycleId));

        Assert.False(result.IsSuccess);
        Assert.Equal("maintenance_history.access_denied", result.Error!.Code);
    }

    [Fact]
    public async Task CreateMaintenanceHistoryEntryAsync_Fails_WhenMotorcycleNotFound()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var ownerId = Guid.NewGuid();
        var (workshop, _) = await WorkshopSeeder.SeedWorkshopWithMemberAsync(context, ownerId, SystemRoles.Owner);
        var service = CreateService(context);

        var result = await service.CreateMaintenanceHistoryEntryAsync(workshop.Id, ownerId, BuildEntryRequest(Guid.NewGuid()));

        Assert.False(result.IsSuccess);
        Assert.Equal("maintenance_history.motorcycle_not_found", result.Error!.Code);
    }

    [Fact]
    public async Task CreateMaintenanceHistoryEntryAsync_Fails_WhenMotorcycleBelongsToAnotherWorkshop()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var ownerAId = Guid.NewGuid();
        var (_, motorcycleId) = await SeedWorkshopWithMotorcycleAsync(context, ownerAId, SystemRoles.Owner);

        var ownerBId = Guid.NewGuid();
        var (workshopB, _) = await WorkshopSeeder.SeedWorkshopWithMemberAsync(context, ownerBId, SystemRoles.Owner, "Workshop B");
        var service = CreateService(context);

        var result = await service.CreateMaintenanceHistoryEntryAsync(workshopB.Id, ownerBId, BuildEntryRequest(motorcycleId));

        Assert.False(result.IsSuccess);
        Assert.Equal("maintenance_history.motorcycle_workshop_mismatch", result.Error!.Code);
    }

    [Fact]
    public async Task GetMaintenanceHistoryEntryByIdAsync_Fails_ForNonexistentEntry()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var ownerId = Guid.NewGuid();
        var (workshop, _) = await WorkshopSeeder.SeedWorkshopWithMemberAsync(context, ownerId, SystemRoles.Owner);
        var service = CreateService(context);

        var result = await service.GetMaintenanceHistoryEntryByIdAsync(workshop.Id, Guid.NewGuid(), ownerId);

        Assert.False(result.IsSuccess);
        Assert.Equal("maintenance_history.entry_not_found", result.Error!.Code);
    }

    [Fact]
    public async Task GetMotorcycleMaintenanceHistoryAsync_ReturnsCreatedEntries()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var ownerId = Guid.NewGuid();
        var (workshop, motorcycleId) = await SeedWorkshopWithMotorcycleAsync(context, ownerId);
        var service = CreateService(context);
        await service.CreateMaintenanceHistoryEntryAsync(workshop.Id, ownerId, BuildEntryRequest(motorcycleId));

        var result = await service.GetMotorcycleMaintenanceHistoryAsync(workshop.Id, motorcycleId, ownerId);

        Assert.True(result.IsSuccess);
        Assert.Single(result.Value!);
    }

    [Fact]
    public async Task GetClientMaintenanceHistoryAsync_Fails_WhenClientBelongsToAnotherWorkshop()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var ownerAId = Guid.NewGuid();
        var (workshopA, _) = await WorkshopSeeder.SeedWorkshopWithMemberAsync(context, ownerAId, SystemRoles.Owner, "Workshop A");
        var clientService = CreateClientService(context);
        var clientA = await clientService.CreateClientAsync(workshopA.Id, ownerAId, BuildClientRequest());

        var ownerBId = Guid.NewGuid();
        var (workshopB, _) = await WorkshopSeeder.SeedWorkshopWithMemberAsync(context, ownerBId, SystemRoles.Owner, "Workshop B");
        var service = CreateService(context);

        var result = await service.GetClientMaintenanceHistoryAsync(workshopB.Id, clientA.Value!.Id, ownerBId);

        Assert.False(result.IsSuccess);
        Assert.Equal("maintenance_history.client_not_found", result.Error!.Code);
    }
}
