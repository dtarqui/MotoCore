using Microsoft.EntityFrameworkCore;
using MotoCore.Application.MaintenanceHistory.Contracts;
using MotoCore.Domain.MaintenanceHistory;

namespace MotoCore.Infrastructure.Persistence;

public sealed class MaintenanceHistoryRepository(MotoCoreDbContext context) : IMaintenanceHistoryRepository
{
    public async Task<MaintenanceHistoryEntry?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await context.MaintenanceHistoryEntries
            .FirstOrDefaultAsync(mh => mh.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyList<MaintenanceHistoryEntry>> GetByMotorcycleIdAsync(Guid motorcycleId, CancellationToken cancellationToken = default)
    {
        return await context.MaintenanceHistoryEntries
            .Where(mh => mh.MotorcycleId == motorcycleId)
            .OrderByDescending(mh => mh.ServiceDate)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<MaintenanceHistoryEntry>> GetByClientIdAsync(Guid clientId, CancellationToken cancellationToken = default)
    {
        return await context.MaintenanceHistoryEntries
            .Where(mh => mh.ClientId == clientId)
            .OrderByDescending(mh => mh.ServiceDate)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<MaintenanceHistoryEntry>> GetByWorkshopIdAsync(Guid workshopId, CancellationToken cancellationToken = default)
    {
        return await context.MaintenanceHistoryEntries
            .Where(mh => mh.WorkshopId == workshopId)
            .OrderByDescending(mh => mh.ServiceDate)
            .ToListAsync(cancellationToken);
    }

    public async Task<MaintenanceHistoryEntry?> GetByWorkOrderIdAsync(Guid workOrderId, CancellationToken cancellationToken = default)
    {
        return await context.MaintenanceHistoryEntries
            .FirstOrDefaultAsync(mh => mh.WorkOrderId == workOrderId, cancellationToken);
    }

    public async Task AddAsync(MaintenanceHistoryEntry entry, CancellationToken cancellationToken = default)
    {
        await context.MaintenanceHistoryEntries.AddAsync(entry, cancellationToken);
    }

    public Task UpdateAsync(MaintenanceHistoryEntry entry, CancellationToken cancellationToken = default)
    {
        context.MaintenanceHistoryEntries.Update(entry);
        return Task.CompletedTask;
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        await context.SaveChangesAsync(cancellationToken);
    }
}
