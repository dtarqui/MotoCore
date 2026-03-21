using MotoCore.Domain.Inventory;

namespace MotoCore.Application.Inventory.Contracts;

public interface IPartRepository
{
    Task<Part?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Part?> GetByPartNumberAsync(Guid workshopId, string partNumber, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Part>> GetByWorkshopIdAsync(Guid workshopId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Part>> GetLowStockPartsAsync(Guid workshopId, CancellationToken cancellationToken = default);
    Task AddAsync(Part part, CancellationToken cancellationToken = default);
    Task UpdateAsync(Part part, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
