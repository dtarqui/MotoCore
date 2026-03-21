using MotoCore.Domain.MaintenanceHistory;

namespace MotoCore.Application.MaintenanceHistory.Contracts;

public interface IMaintenanceHistoryRepository
{
    Task<MaintenanceHistoryEntry?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<MaintenanceHistoryEntry>> GetByMotorcycleIdAsync(Guid motorcycleId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<MaintenanceHistoryEntry>> GetByClientIdAsync(Guid clientId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<MaintenanceHistoryEntry>> GetByWorkshopIdAsync(Guid workshopId, CancellationToken cancellationToken = default);
    Task<MaintenanceHistoryEntry?> GetByWorkOrderIdAsync(Guid workOrderId, CancellationToken cancellationToken = default);
    Task AddAsync(MaintenanceHistoryEntry entry, CancellationToken cancellationToken = default);
    Task UpdateAsync(MaintenanceHistoryEntry entry, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
