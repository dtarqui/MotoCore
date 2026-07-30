using MotoCore.Application.Audit.Contracts;
using MotoCore.Application.Audit.Models;
using MotoCore.Application.Common.Results;
using MotoCore.Application.Workshops.Contracts;
using MotoCore.Domain.Audit;
using MotoCore.Domain.Auth;

namespace MotoCore.Application.Audit.Services;

public sealed class AuditLogService(
    IAuditLogRepository auditLogRepository,
    IWorkshopRepository workshopRepository) : IAuditLogService
{
    public async Task LogAsync(
        Guid workshopId,
        Guid performedByUserId,
        string action,
        string entityType,
        Guid? entityId,
        string? details,
        CancellationToken cancellationToken = default)
    {
        var entry = new AuditLogEntry
        {
            WorkshopId = workshopId,
            PerformedByUserId = performedByUserId,
            Action = action,
            EntityType = entityType,
            EntityId = entityId,
            Details = details,
        };

        await auditLogRepository.AddAsync(entry, cancellationToken);
        await auditLogRepository.SaveChangesAsync(cancellationToken);
    }

    public async Task<Result<IReadOnlyList<AuditLogEntryDto>>> GetWorkshopAuditLogAsync(
        Guid workshopId,
        Guid requestingUserId,
        CancellationToken cancellationToken = default)
    {
        var membership = await workshopRepository.GetMembershipAsync(workshopId, requestingUserId, cancellationToken);
        if (membership is null || !membership.IsActive)
        {
            return Result<IReadOnlyList<AuditLogEntryDto>>.Failure("audit.access_denied", "You don't have access to this workshop.");
        }

        if (!SystemRoles.IsOwner(membership.Role))
        {
            return Result<IReadOnlyList<AuditLogEntryDto>>.Failure("audit.insufficient_permissions", "Only Owner can view the audit log.");
        }

        var entries = await auditLogRepository.GetByWorkshopIdAsync(workshopId, cancellationToken);
        var dtos = entries
            .OrderByDescending(entry => entry.CreatedAtUtc)
            .Select(MapToDto)
            .ToList()
            .AsReadOnly();

        return Result<IReadOnlyList<AuditLogEntryDto>>.Success(dtos);
    }

    private static AuditLogEntryDto MapToDto(AuditLogEntry entry) =>
        new(
            entry.Id,
            entry.WorkshopId,
            entry.PerformedByUserId,
            entry.Action,
            entry.EntityType,
            entry.EntityId,
            entry.Details,
            entry.CreatedAtUtc);
}
