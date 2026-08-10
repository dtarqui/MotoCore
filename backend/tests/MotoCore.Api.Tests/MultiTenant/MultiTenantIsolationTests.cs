using MotoCore.Api.Tests.TestSupport;
using MotoCore.Application.Clients.Models;
using MotoCore.Application.Clients.Services;
using MotoCore.Application.Motorcycles.Models;
using MotoCore.Application.Motorcycles.Services;
using MotoCore.Domain.Auth;
using MotoCore.Infrastructure.Persistence;

namespace MotoCore.Api.Tests.MultiTenant;

/// <summary>
/// Guards the core SaaS guarantee: data belonging to one workshop must never be
/// visible or reachable from another workshop's context, regardless of role.
/// </summary>
public class MultiTenantIsolationTests
{
    private static ClientService CreateClientService(MotoCoreDbContext context) =>
        new(new ClientRepository(context), new WorkshopRepository(context));

    private static MotorcycleService CreateMotorcycleService(MotoCoreDbContext context) =>
        new(new MotorcycleRepository(context), new WorkshopRepository(context), new ClientRepository(context));

    private static CreateClientRequest BuildClientRequest(string email) =>
        new("Juan", "Perez", email, "555-0100", null, null, null, null, null, null, null, null, null, null);

    [Fact]
    public async Task GetWorkshopClientsAsync_DoesNotLeakClientsAcrossWorkshops()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var clientService = CreateClientService(context);

        var ownerAId = Guid.NewGuid();
        var (workshopA, _) = await WorkshopSeeder.SeedWorkshopWithMemberAsync(context, ownerAId, SystemRoles.Owner, "Workshop A");
        await clientService.CreateClientAsync(workshopA.Id, ownerAId, BuildClientRequest("client@workshopA.com"));

        var ownerBId = Guid.NewGuid();
        var (workshopB, _) = await WorkshopSeeder.SeedWorkshopWithMemberAsync(context, ownerBId, SystemRoles.Owner, "Workshop B");

        var result = await clientService.GetWorkshopClientsAsync(workshopB.Id, ownerBId);

        Assert.True(result.IsSuccess);
        Assert.Empty(result.Value!);
    }

    [Fact]
    public async Task GetClientByIdAsync_ReturnsNotFound_ForClientBelongingToAnotherWorkshop()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var clientService = CreateClientService(context);

        var ownerAId = Guid.NewGuid();
        var (workshopA, _) = await WorkshopSeeder.SeedWorkshopWithMemberAsync(context, ownerAId, SystemRoles.Owner, "Workshop A");
        var created = await clientService.CreateClientAsync(workshopA.Id, ownerAId, BuildClientRequest("client@workshopA.com"));

        var ownerBId = Guid.NewGuid();
        var (workshopB, _) = await WorkshopSeeder.SeedWorkshopWithMemberAsync(context, ownerBId, SystemRoles.Owner, "Workshop B");

        var result = await clientService.GetClientByIdAsync(workshopB.Id, created.Value!.Id, ownerBId);

        Assert.False(result.IsSuccess);
        Assert.Equal("client.not_found", result.Error!.Code);
    }

    [Fact]
    public async Task CreateMotorcycleAsync_Fails_WhenClientBelongsToAnotherWorkshop()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var clientService = CreateClientService(context);
        var motorcycleService = CreateMotorcycleService(context);

        var ownerAId = Guid.NewGuid();
        var (workshopA, _) = await WorkshopSeeder.SeedWorkshopWithMemberAsync(context, ownerAId, SystemRoles.Owner, "Workshop A");
        var clientInA = await clientService.CreateClientAsync(workshopA.Id, ownerAId, BuildClientRequest("client@workshopA.com"));

        var ownerBId = Guid.NewGuid();
        var (workshopB, _) = await WorkshopSeeder.SeedWorkshopWithMemberAsync(context, ownerBId, SystemRoles.Owner, "Workshop B");

        var request = new CreateMotorcycleRequest(clientInA.Value!.Id, "Yamaha", "FZ25", 2022, "XYZ-999", null, null, null, null, null);
        var result = await motorcycleService.CreateMotorcycleAsync(workshopB.Id, ownerBId, request);

        Assert.False(result.IsSuccess);
        Assert.Equal("motorcycle.client_workshop_mismatch", result.Error!.Code);
    }

    [Fact]
    public async Task GetMembershipAsync_ReturnsNull_ForUserWithNoMembershipInWorkshop()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var ownerAId = Guid.NewGuid();
        var (workshopA, _) = await WorkshopSeeder.SeedWorkshopWithMemberAsync(context, ownerAId, SystemRoles.Owner, "Workshop A");

        var workshopRepository = new WorkshopRepository(context);
        var membership = await workshopRepository.GetMembershipAsync(workshopA.Id, Guid.NewGuid());

        Assert.Null(membership);
    }
}
