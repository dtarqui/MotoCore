using MotoCore.Api.Tests.TestSupport;
using MotoCore.Application.WorkOrders.Models;
using MotoCore.Application.WorkOrders.Services;
using MotoCore.Domain.Auth;
using MotoCore.Domain.Motorcycles;
using MotoCore.Domain.WorkOrders;
using MotoCore.Infrastructure.Persistence;

namespace MotoCore.Api.Tests.WorkOrders;

public class WorkOrderServiceTests
{
    private static async Task<Motorcycle> SeedMotorcycleAsync(MotoCoreDbContext context, Guid workshopId)
    {
        var motorcycle = new Motorcycle
        {
            WorkshopId = workshopId,
            ClientId = Guid.NewGuid(),
            Brand = "Honda",
            Model = "CB190R",
            Year = 2023,
            LicensePlate = $"ABC-{Guid.NewGuid().ToString()[..4]}",
            IsActive = true,
        };

        context.Motorcycles.Add(motorcycle);
        await context.SaveChangesAsync();

        return motorcycle;
    }

    private static WorkOrderService CreateService(MotoCoreDbContext context) =>
        new(new WorkOrderRepository(context), new MotorcycleRepository(context), new WorkshopRepository(context));

    [Fact]
    public async Task CreateWorkOrderAsync_Succeeds_ForOwner()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var ownerId = Guid.NewGuid();
        var (workshop, _) = await WorkshopSeeder.SeedWorkshopWithMemberAsync(context, ownerId, SystemRoles.Owner);
        var motorcycle = await SeedMotorcycleAsync(context, workshop.Id);
        var service = CreateService(context);

        var request = new CreateWorkOrderRequest(motorcycle.Id, "Cambio de aceite", 12000, 50m, null, null, null);
        var result = await service.CreateWorkOrderAsync(workshop.Id, ownerId, request);

        Assert.True(result.IsSuccess);
        Assert.Equal(WorkOrderStatus.Pending, result.Value!.Status);
        Assert.StartsWith($"WO-{DateTime.UtcNow.Year}-", result.Value.OrderNumber);
    }

    [Fact]
    public async Task CreateWorkOrderAsync_Fails_WhenMotorcycleBelongsToDifferentWorkshop()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var ownerId = Guid.NewGuid();
        var (workshopA, _) = await WorkshopSeeder.SeedWorkshopWithMemberAsync(context, ownerId, SystemRoles.Owner, "Workshop A");

        var otherOwnerId = Guid.NewGuid();
        var (workshopB, _) = await WorkshopSeeder.SeedWorkshopWithMemberAsync(context, otherOwnerId, SystemRoles.Owner, "Workshop B");
        var motorcycleInWorkshopB = await SeedMotorcycleAsync(context, workshopB.Id);

        var service = CreateService(context);
        var request = new CreateWorkOrderRequest(motorcycleInWorkshopB.Id, "Revisión", null, 0m, null, null, null);

        var result = await service.CreateWorkOrderAsync(workshopA.Id, ownerId, request);

        Assert.False(result.IsSuccess);
        Assert.Equal("workorder.motorcycle_workshop_mismatch", result.Error!.Code);
    }

    [Fact]
    public async Task CreateWorkOrderAsync_Fails_ForMechanicRole()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var mechanicId = Guid.NewGuid();
        var (workshop, _) = await WorkshopSeeder.SeedWorkshopWithMemberAsync(context, mechanicId, SystemRoles.Mechanic);
        var motorcycle = await SeedMotorcycleAsync(context, workshop.Id);
        var service = CreateService(context);

        var request = new CreateWorkOrderRequest(motorcycle.Id, "Diagnóstico", null, 0m, null, null, null);
        var result = await service.CreateWorkOrderAsync(workshop.Id, mechanicId, request);

        Assert.False(result.IsSuccess);
        Assert.Equal("workorder.insufficient_permissions", result.Error!.Code);
    }

    [Fact]
    public async Task UpdateWorkOrderStatusAsync_Fails_ForReceptionistRole()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var receptionistId = Guid.NewGuid();
        var (workshop, _) = await WorkshopSeeder.SeedWorkshopWithMemberAsync(context, receptionistId, SystemRoles.Receptionist);
        var motorcycle = await SeedMotorcycleAsync(context, workshop.Id);
        var service = CreateService(context);

        var created = await service.CreateWorkOrderAsync(
            workshop.Id, receptionistId, new CreateWorkOrderRequest(motorcycle.Id, "Cambio de llanta", null, 0m, null, null, null));
        Assert.True(created.IsSuccess);

        var result = await service.UpdateWorkOrderStatusAsync(
            workshop.Id, created.Value!.Id, receptionistId, new UpdateWorkOrderStatusRequest(WorkOrderStatus.InRepair));

        Assert.False(result.IsSuccess);
        Assert.Equal("workorder.insufficient_permissions", result.Error!.Code);
    }

    [Fact]
    public async Task CloseWorkOrderAsync_Fails_WhenAlreadyDelivered()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var ownerId = Guid.NewGuid();
        var (workshop, _) = await WorkshopSeeder.SeedWorkshopWithMemberAsync(context, ownerId, SystemRoles.Owner);
        var motorcycle = await SeedMotorcycleAsync(context, workshop.Id);

        var workOrder = new WorkOrder
        {
            Id = Guid.NewGuid(),
            WorkshopId = workshop.Id,
            MotorcycleId = motorcycle.Id,
            OrderNumber = "WO-TEST-00001",
            Status = WorkOrderStatus.Delivered,
            EstimatedCost = 0,
            FinalCost = 100,
            CreatedByUserId = ownerId,
            IsActive = true,
        };
        context.WorkOrders.Add(workOrder);
        await context.SaveChangesAsync();

        var service = CreateService(context);
        var result = await service.CloseWorkOrderAsync(
            workshop.Id, workOrder.Id, ownerId, new CloseWorkOrderRequest(150m, null));

        Assert.False(result.IsSuccess);
        Assert.Equal("workorder.already_closed", result.Error!.Code);
    }

    [Fact]
    public async Task DeliverWorkOrderAsync_Fails_WhenNotCompleted()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var ownerId = Guid.NewGuid();
        var (workshop, _) = await WorkshopSeeder.SeedWorkshopWithMemberAsync(context, ownerId, SystemRoles.Owner);
        var motorcycle = await SeedMotorcycleAsync(context, workshop.Id);
        var service = CreateService(context);

        var created = await service.CreateWorkOrderAsync(
            workshop.Id, ownerId, new CreateWorkOrderRequest(motorcycle.Id, "Frenos", null, 0m, null, null, null));

        var result = await service.DeliverWorkOrderAsync(workshop.Id, created.Value!.Id, ownerId);

        Assert.False(result.IsSuccess);
        Assert.Equal("workorder.not_completed", result.Error!.Code);
    }

    [Fact]
    public async Task GetWorkOrderByIdAsync_ReturnsNotFound_ForOrderInDifferentWorkshop()
    {
        await using var context = InMemoryDbContextFactory.Create();

        var ownerAId = Guid.NewGuid();
        var (workshopA, _) = await WorkshopSeeder.SeedWorkshopWithMemberAsync(context, ownerAId, SystemRoles.Owner, "Workshop A");
        var motorcycleA = await SeedMotorcycleAsync(context, workshopA.Id);

        var service = CreateService(context);
        var created = await service.CreateWorkOrderAsync(
            workshopA.Id, ownerAId, new CreateWorkOrderRequest(motorcycleA.Id, "Servicio A", null, 0m, null, null, null));
        Assert.True(created.IsSuccess);

        var ownerBId = Guid.NewGuid();
        var (workshopB, _) = await WorkshopSeeder.SeedWorkshopWithMemberAsync(context, ownerBId, SystemRoles.Owner, "Workshop B");

        var result = await service.GetWorkOrderByIdAsync(workshopB.Id, created.Value!.Id, ownerBId);

        Assert.False(result.IsSuccess);
        Assert.Equal("workorder.not_found", result.Error!.Code);
    }
}
