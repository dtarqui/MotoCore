namespace MotoCore.Application.Audit.Models;

public sealed record AuditLogEntryDto(
    Guid Id,
    Guid WorkshopId,
    Guid PerformedByUserId,
    string Action,
    string EntityType,
    Guid? EntityId,
    string? Details,
    DateTimeOffset CreatedAtUtc);
