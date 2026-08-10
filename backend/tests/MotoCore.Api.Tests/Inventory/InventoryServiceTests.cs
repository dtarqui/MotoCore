using MotoCore.Api.Tests.TestSupport;
using MotoCore.Application.Audit.Services;
using MotoCore.Application.Inventory.Models;
using MotoCore.Application.Inventory.Services;
using MotoCore.Domain.Auth;
using MotoCore.Domain.Inventory;
using MotoCore.Infrastructure.Persistence;

namespace MotoCore.Api.Tests.Inventory;

public class InventoryServiceTests
{
    private static InventoryService CreateService(MotoCoreDbContext context) =>
        new(new PartRepository(context), new PartMovementRepository(context), new WorkshopRepository(context), CreateAuditLogService(context));

    private static AuditLogService CreateAuditLogService(MotoCoreDbContext context) =>
        new(new AuditLogRepository(context), new WorkshopRepository(context));

    private static CreatePartRequest BuildCreateRequest(string partNumber, int initialStock = 10, int minimumStock = 5) =>
        new(partNumber, "Aceite 10W-40", null, null, null, initialStock, minimumStock, 100, 2.5m, 5m, null, null, null, null);

    [Fact]
    public async Task CreatePartAsync_Succeeds_AndRecordsInitialStockMovement()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var ownerId = Guid.NewGuid();
        var (workshop, _) = await WorkshopSeeder.SeedWorkshopWithMemberAsync(context, ownerId, SystemRoles.Owner);
        var service = CreateService(context);

        var result = await service.CreatePartAsync(workshop.Id, ownerId, BuildCreateRequest("OIL-001"));

        Assert.True(result.IsSuccess);
        Assert.Equal(10, result.Value!.CurrentStock);

        var movements = await service.GetWorkshopMovementsAsync(workshop.Id, ownerId);
        Assert.True(movements.IsSuccess);
        Assert.Single(movements.Value!);
        Assert.Equal(PartMovementType.Purchase, movements.Value![0].MovementType);
    }

    [Fact]
    public async Task CreatePartAsync_Fails_WhenPartNumberAlreadyExists()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var ownerId = Guid.NewGuid();
        var (workshop, _) = await WorkshopSeeder.SeedWorkshopWithMemberAsync(context, ownerId, SystemRoles.Owner);
        var service = CreateService(context);

        await service.CreatePartAsync(workshop.Id, ownerId, BuildCreateRequest("OIL-001"));
        var result = await service.CreatePartAsync(workshop.Id, ownerId, BuildCreateRequest("oil-001"));

        Assert.False(result.IsSuccess);
        Assert.Equal("inventory.part_number_exists", result.Error!.Code);
    }

    [Fact]
    public async Task CreatePartMovementAsync_Sale_DecreasesStock()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var ownerId = Guid.NewGuid();
        var (workshop, _) = await WorkshopSeeder.SeedWorkshopWithMemberAsync(context, ownerId, SystemRoles.Owner);
        var service = CreateService(context);

        var part = await service.CreatePartAsync(workshop.Id, ownerId, BuildCreateRequest("OIL-001", initialStock: 10));

        var movement = await service.CreatePartMovementAsync(
            workshop.Id, ownerId, new CreatePartMovementRequest(part.Value!.Id, PartMovementType.Sale, 3, null, null, null, null));

        Assert.True(movement.IsSuccess);
        Assert.Equal(7, movement.Value!.NewStock);

        var updatedPart = await service.GetPartByIdAsync(workshop.Id, part.Value.Id, ownerId);
        Assert.Equal(7, updatedPart.Value!.CurrentStock);
    }

    [Fact]
    public async Task CreatePartMovementAsync_Fails_WhenInsufficientStock()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var ownerId = Guid.NewGuid();
        var (workshop, _) = await WorkshopSeeder.SeedWorkshopWithMemberAsync(context, ownerId, SystemRoles.Owner);
        var service = CreateService(context);

        var part = await service.CreatePartAsync(workshop.Id, ownerId, BuildCreateRequest("OIL-001", initialStock: 2));

        var movement = await service.CreatePartMovementAsync(
            workshop.Id, ownerId, new CreatePartMovementRequest(part.Value!.Id, PartMovementType.Sale, 5, null, null, null, null));

        Assert.False(movement.IsSuccess);
        Assert.Equal("inventory.insufficient_stock", movement.Error!.Code);
    }

    [Fact]
    public async Task DeletePartAsync_Fails_ForNonOwnerRole()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var receptionistId = Guid.NewGuid();
        var (workshop, _) = await WorkshopSeeder.SeedWorkshopWithMemberAsync(context, receptionistId, SystemRoles.Receptionist);
        var service = CreateService(context);

        var part = await service.CreatePartAsync(workshop.Id, receptionistId, BuildCreateRequest("OIL-001"));
        Assert.True(part.IsSuccess);

        var result = await service.DeletePartAsync(workshop.Id, part.Value!.Id, receptionistId);

        Assert.False(result.IsSuccess);
        Assert.Equal("inventory.insufficient_permissions", result.Error!.Code);
    }

    [Fact]
    public async Task GetWorkshopPartsAsync_DoesNotReturnPartsFromOtherWorkshop()
    {
        await using var context = InMemoryDbContextFactory.Create();

        var ownerAId = Guid.NewGuid();
        var (workshopA, _) = await WorkshopSeeder.SeedWorkshopWithMemberAsync(context, ownerAId, SystemRoles.Owner, "Workshop A");
        var service = CreateService(context);
        await service.CreatePartAsync(workshopA.Id, ownerAId, BuildCreateRequest("OIL-001"));

        var ownerBId = Guid.NewGuid();
        var (workshopB, _) = await WorkshopSeeder.SeedWorkshopWithMemberAsync(context, ownerBId, SystemRoles.Owner, "Workshop B");

        var result = await service.GetWorkshopPartsAsync(workshopB.Id, ownerBId);

        Assert.True(result.IsSuccess);
        Assert.Empty(result.Value!);
    }

    [Fact]
    public async Task GetWorkshopPartsPagedAsync_ReturnsCorrectPageAndTotalCount()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var ownerId = Guid.NewGuid();
        var (workshop, _) = await WorkshopSeeder.SeedWorkshopWithMemberAsync(context, ownerId, SystemRoles.Owner);
        var service = CreateService(context);
        for (var i = 0; i < 3; i++)
        {
            await service.CreatePartAsync(workshop.Id, ownerId, BuildCreateRequest($"OIL-{i:D3}"));
        }

        var result = await service.GetWorkshopPartsPagedAsync(workshop.Id, ownerId, page: 1, pageSize: 2);

        Assert.True(result.IsSuccess);
        Assert.Equal(2, result.Value!.Items.Count);
        Assert.Equal(3, result.Value.TotalCount);
    }

    [Fact]
    public async Task GetWorkshopPartsPagedAsync_ReturnsEmptyItems_WhenPageOutOfRange()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var ownerId = Guid.NewGuid();
        var (workshop, _) = await WorkshopSeeder.SeedWorkshopWithMemberAsync(context, ownerId, SystemRoles.Owner);
        var service = CreateService(context);

        var result = await service.GetWorkshopPartsPagedAsync(workshop.Id, ownerId, page: 5, pageSize: 20);

        Assert.True(result.IsSuccess);
        Assert.Empty(result.Value!.Items);
        Assert.Equal(0, result.Value.TotalCount);
    }

    [Fact]
    public async Task GetWorkshopMovementsPagedAsync_ReturnsCorrectPageAndTotalCount()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var ownerId = Guid.NewGuid();
        var (workshop, _) = await WorkshopSeeder.SeedWorkshopWithMemberAsync(context, ownerId, SystemRoles.Owner);
        var service = CreateService(context);
        var part = await service.CreatePartAsync(workshop.Id, ownerId, BuildCreateRequest("OIL-001", initialStock: 100));
        for (var i = 0; i < 3; i++)
        {
            await service.CreatePartMovementAsync(
                workshop.Id, ownerId, new CreatePartMovementRequest(part.Value!.Id, PartMovementType.Sale, 1, null, null, null, null));
        }

        var result = await service.GetWorkshopMovementsPagedAsync(workshop.Id, ownerId, page: 1, pageSize: 2);

        Assert.True(result.IsSuccess);
        Assert.Equal(2, result.Value!.Items.Count);
        Assert.Equal(4, result.Value.TotalCount);
    }
}
