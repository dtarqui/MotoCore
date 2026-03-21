namespace MotoCore.Application.WorkOrders.Models;

public sealed record WorkOrderDto(
    Guid Id,
    Guid WorkshopId,
    Guid MotorcycleId,
    string OrderNumber,
    string Status,
    string? Description,
    string? Diagnosis,
    int? CurrentMileage,
    decimal EstimatedCost,
    decimal FinalCost,
    DateTimeOffset? ScheduledDate,
    DateTimeOffset? StartedAtUtc,
    DateTimeOffset? CompletedAtUtc,
    DateTimeOffset? DeliveredAtUtc,
    Guid CreatedByUserId,
    Guid? AssignedMechanicUserId,
    string? Notes,
    bool IsActive,
    DateTimeOffset CreatedAtUtc);

public sealed record CreateWorkOrderRequest(
    Guid MotorcycleId,
    string Description,
    int? CurrentMileage,
    decimal EstimatedCost,
    DateTimeOffset? ScheduledDate,
    Guid? AssignedMechanicUserId,
    string? Notes);

public sealed record UpdateWorkOrderStatusRequest(
    string Status);

public sealed record UpdateWorkOrderDiagnosisRequest(
    string Diagnosis);

public sealed record CloseWorkOrderRequest(
    decimal FinalCost,
    string? Notes);
