using MotoCore.Application.Common.Results;
using MotoCore.Application.MaintenanceHistory.Models;

namespace MotoCore.Application.MaintenanceHistory.Contracts;

public interface IMaintenanceHistoryService
{
    Task<Result<MaintenanceHistoryEntryDto>> CreateMaintenanceHistoryEntryAsync(Guid workshopId, Guid requestingUserId, CreateMaintenanceHistoryEntryRequest request, CancellationToken cancellationToken = default);
    Task<Result<MaintenanceHistoryEntryDto>> GetMaintenanceHistoryEntryByIdAsync(Guid workshopId, Guid entryId, Guid requestingUserId, CancellationToken cancellationToken = default);
    Task<Result<IReadOnlyList<MaintenanceHistoryEntryDto>>> GetMotorcycleMaintenanceHistoryAsync(Guid workshopId, Guid motorcycleId, Guid requestingUserId, CancellationToken cancellationToken = default);
    Task<Result<IReadOnlyList<MaintenanceHistoryEntryDto>>> GetClientMaintenanceHistoryAsync(Guid workshopId, Guid clientId, Guid requestingUserId, CancellationToken cancellationToken = default);
    
    // TODO: Implementar cuando se defina el sistema de almacenamiento (S3 u otro)
    // Task<Result> UploadMaintenancePhotoAsync(Guid workshopId, Guid entryId, Guid requestingUserId, UploadMaintenancePhotoRequest request, CancellationToken cancellationToken = default);
}
