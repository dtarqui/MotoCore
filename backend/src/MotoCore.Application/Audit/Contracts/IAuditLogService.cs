using MotoCore.Application.Audit.Models;
using MotoCore.Application.Common.Results;

namespace MotoCore.Application.Audit.Contracts;

public interface IAuditLogService
{
    Task LogAsync(
        Guid workshopId,
        Guid performedByUserId,
        string action,
        string entityType,
        Guid? entityId,
        string? details,
        CancellationToken cancellationToken = default);

    Task<Result<IReadOnlyList<AuditLogEntryDto>>> GetWorkshopAuditLogAsync(
        Guid workshopId,
        Guid requestingUserId,
        CancellationToken cancellationToken = default);
}
