using Microsoft.EntityFrameworkCore;
using MotoCore.Application.Inventory.Contracts;
using MotoCore.Domain.Inventory;

namespace MotoCore.Infrastructure.Persistence;

public sealed class PartMovementRepository(MotoCoreDbContext context) : IPartMovementRepository
{
    public async Task<PartMovement?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await context.PartMovements
            .FirstOrDefaultAsync(pm => pm.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyList<PartMovement>> GetByWorkshopIdAsync(Guid workshopId, CancellationToken cancellationToken = default)
    {
        return await context.PartMovements
            .Where(pm => pm.WorkshopId == workshopId)
            .OrderByDescending(pm => pm.CreatedAtUtc)
            .ToListAsync(cancellationToken);
    }

    public async Task<(IReadOnlyList<PartMovement> Items, int TotalCount)> GetByWorkshopIdPagedAsync(Guid workshopId, int page, int pageSize, CancellationToken cancellationToken = default)
    {
        var query = context.PartMovements.Where(pm => pm.WorkshopId == workshopId);

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(pm => pm.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    public async Task<IReadOnlyList<PartMovement>> GetByPartIdAsync(Guid partId, CancellationToken cancellationToken = default)
    {
        return await context.PartMovements
            .Where(pm => pm.PartId == partId)
            .OrderByDescending(pm => pm.CreatedAtUtc)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<PartMovement>> GetByWorkOrderIdAsync(Guid workOrderId, CancellationToken cancellationToken = default)
    {
        return await context.PartMovements
            .Where(pm => pm.WorkOrderId == workOrderId)
            .OrderByDescending(pm => pm.CreatedAtUtc)
            .ToListAsync(cancellationToken);
    }

    public async Task AddAsync(PartMovement movement, CancellationToken cancellationToken = default)
    {
        await context.PartMovements.AddAsync(movement, cancellationToken);
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        await context.SaveChangesAsync(cancellationToken);
    }
}
