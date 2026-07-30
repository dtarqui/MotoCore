using MotoCore.Domain.Audit;

namespace MotoCore.Application.Audit.Contracts;

public interface IAuditLogRepository
{
    Task AddAsync(AuditLogEntry entry, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AuditLogEntry>> GetByWorkshopIdAsync(Guid workshopId, CancellationToken cancellationToken = default);

    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
