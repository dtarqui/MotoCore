using MotoCore.Application.Common.Models;
using MotoCore.Application.Common.Results;
using MotoCore.Application.Motorcycles.Models;

namespace MotoCore.Application.Motorcycles.Contracts;

public interface IMotorcycleService
{
    Task<Result<MotorcycleDto>> CreateMotorcycleAsync(Guid workshopId, Guid requestingUserId, CreateMotorcycleRequest request, CancellationToken cancellationToken = default);
    Task<Result<MotorcycleDto>> GetMotorcycleByIdAsync(Guid workshopId, Guid motorcycleId, Guid requestingUserId, CancellationToken cancellationToken = default);
    Task<Result<IReadOnlyList<MotorcycleDto>>> GetWorkshopMotorcyclesAsync(Guid workshopId, Guid requestingUserId, CancellationToken cancellationToken = default);
    Task<Result<PagedResult<MotorcycleDto>>> GetWorkshopMotorcyclesPagedAsync(Guid workshopId, Guid requestingUserId, int page, int pageSize, CancellationToken cancellationToken = default);
    Task<Result<IReadOnlyList<MotorcycleDto>>> GetClientMotorcyclesAsync(Guid workshopId, Guid clientId, Guid requestingUserId, CancellationToken cancellationToken = default);
    Task<Result<MotorcycleDto>> UpdateMotorcycleAsync(Guid workshopId, Guid motorcycleId, Guid requestingUserId, UpdateMotorcycleRequest request, CancellationToken cancellationToken = default);
    Task<Result> DeleteMotorcycleAsync(Guid workshopId, Guid motorcycleId, Guid requestingUserId, CancellationToken cancellationToken = default);
}
