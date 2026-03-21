using MotoCore.Application.Common.Results;
using MotoCore.Application.Inventory.Models;

namespace MotoCore.Application.Inventory.Contracts;

public interface IInventoryService
{
    Task<Result<PartDto>> CreatePartAsync(Guid workshopId, Guid requestingUserId, CreatePartRequest request, CancellationToken cancellationToken = default);
    Task<Result<PartDto>> GetPartByIdAsync(Guid workshopId, Guid partId, Guid requestingUserId, CancellationToken cancellationToken = default);
    Task<Result<IReadOnlyList<PartDto>>> GetWorkshopPartsAsync(Guid workshopId, Guid requestingUserId, CancellationToken cancellationToken = default);
    Task<Result<IReadOnlyList<PartDto>>> GetLowStockPartsAsync(Guid workshopId, Guid requestingUserId, CancellationToken cancellationToken = default);
    Task<Result<PartDto>> UpdatePartAsync(Guid workshopId, Guid partId, Guid requestingUserId, UpdatePartRequest request, CancellationToken cancellationToken = default);
    Task<Result> DeletePartAsync(Guid workshopId, Guid partId, Guid requestingUserId, CancellationToken cancellationToken = default);
    Task<Result<PartMovementDto>> CreatePartMovementAsync(Guid workshopId, Guid requestingUserId, CreatePartMovementRequest request, CancellationToken cancellationToken = default);
    Task<Result<IReadOnlyList<PartMovementDto>>> GetWorkshopMovementsAsync(Guid workshopId, Guid requestingUserId, CancellationToken cancellationToken = default);
}
