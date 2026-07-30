using Microsoft.EntityFrameworkCore;
using MotoCore.Application.Audit.Contracts;
using MotoCore.Domain.Audit;

namespace MotoCore.Infrastructure.Persistence;

public sealed class AuditLogRepository(MotoCoreDbContext context) : IAuditLogRepository
{
    public async Task AddAsync(AuditLogEntry entry, CancellationToken cancellationToken = default)
    {
        await context.AuditLogEntries.AddAsync(entry, cancellationToken);
    }

    public async Task<IReadOnlyList<AuditLogEntry>> GetByWorkshopIdAsync(Guid workshopId, CancellationToken cancellationToken = default)
    {
        return await context.AuditLogEntries
            .Where(entry => entry.WorkshopId == workshopId)
            .OrderByDescending(entry => entry.CreatedAtUtc)
            .ToListAsync(cancellationToken);
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        await context.SaveChangesAsync(cancellationToken);
    }
}
