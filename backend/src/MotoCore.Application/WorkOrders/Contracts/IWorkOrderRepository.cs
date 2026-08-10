using MotoCore.Domain.WorkOrders;

namespace MotoCore.Application.WorkOrders.Contracts;

public interface IWorkOrderRepository
{
    Task<WorkOrder?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<WorkOrder?> GetByOrderNumberAsync(Guid workshopId, string orderNumber, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<WorkOrder>> GetByWorkshopIdAsync(Guid workshopId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<WorkOrder>> GetByMotorcycleIdAsync(Guid motorcycleId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<WorkOrder>> GetByStatusAsync(Guid workshopId, string status, CancellationToken cancellationToken = default);
    Task AddAsync(WorkOrder workOrder, CancellationToken cancellationToken = default);
    Task UpdateAsync(WorkOrder workOrder, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
