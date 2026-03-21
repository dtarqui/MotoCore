namespace MotoCore.Application.MaintenanceHistory.Models;

public sealed record MaintenanceHistoryEntryDto(
    Guid Id,
    Guid WorkshopId,
    Guid MotorcycleId,
    Guid ClientId,
    Guid? WorkOrderId,
    string Title,
    string Description,
    int? MileageAtService,
    decimal TotalCost,
    DateTimeOffset ServiceDate,
    Guid PerformedByUserId,
    string? ServicesPerformed,
    string? PartsUsed,
    string? Recommendations,
    string? Notes,
    DateTimeOffset CreatedAtUtc);

public sealed record CreateMaintenanceHistoryEntryRequest(
    Guid MotorcycleId,
    string Title,
    string Description,
    int? MileageAtService,
    decimal TotalCost,
    DateTimeOffset ServiceDate,
    string? ServicesPerformed,
    string? PartsUsed,
    string? Recommendations,
    string? Notes);

// TODO: Implementar cuando se defina el sistema de almacenamiento (S3 u otro)
// public sealed record UploadMaintenancePhotoRequest(
//     IFormFile Photo,
//     string? Description
// );
