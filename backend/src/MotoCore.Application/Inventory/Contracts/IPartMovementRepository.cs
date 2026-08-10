using MotoCore.Domain.Inventory;

namespace MotoCore.Application.Inventory.Contracts;

public interface IPartMovementRepository
{
    Task<PartMovement?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<PartMovement>> GetByWorkshopIdAsync(Guid workshopId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<PartMovement>> GetByPartIdAsync(Guid partId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<PartMovement>> GetByWorkOrderIdAsync(Guid workOrderId, CancellationToken cancellationToken = default);
    Task AddAsync(PartMovement movement, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
