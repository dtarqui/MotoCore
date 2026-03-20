using Microsoft.EntityFrameworkCore;
using MotoCore.Application.Workshops.Contracts;
using MotoCore.Domain.Workshops;

namespace MotoCore.Infrastructure.Persistence;

public sealed class WorkshopRepository(MotoCoreDbContext dbContext) : IWorkshopRepository
{
    public async Task<Workshop?> GetByIdAsync(Guid workshopId, CancellationToken cancellationToken = default)
    {
        return await dbContext.Workshops
            .FirstOrDefaultAsync(w => w.Id == workshopId, cancellationToken);
    }

    public async Task<IReadOnlyList<Workshop>> GetByOwnerIdAsync(Guid ownerId, CancellationToken cancellationToken = default)
    {
        return await dbContext.Workshops
            .Where(w => w.OwnerId == ownerId)
            .OrderByDescending(w => w.CreatedAtUtc)
            .ToListAsync(cancellationToken);
    }

    public async Task<WorkshopMembership?> GetMembershipAsync(Guid workshopId, Guid userId, CancellationToken cancellationToken = default)
    {
        return await dbContext.WorkshopMemberships
            .Include(m => m.UserAccount)
            .Include(m => m.Workshop)
            .FirstOrDefaultAsync(m => m.WorkshopId == workshopId && m.UserAccountId == userId, cancellationToken);
    }

    public async Task<IReadOnlyList<WorkshopMembership>> GetMembersAsync(Guid workshopId, CancellationToken cancellationToken = default)
    {
        return await dbContext.WorkshopMemberships
            .Include(m => m.UserAccount)
            .Where(m => m.WorkshopId == workshopId && m.IsActive)
            .OrderBy(m => m.JoinedAtUtc)
            .ToListAsync(cancellationToken);
    }

    public async Task AddAsync(Workshop workshop, CancellationToken cancellationToken = default)
    {
        await dbContext.Workshops.AddAsync(workshop, cancellationToken);
    }

    public async Task AddMembershipAsync(WorkshopMembership membership, CancellationToken cancellationToken = default)
    {
        await dbContext.WorkshopMemberships.AddAsync(membership, cancellationToken);
    }

    public Task UpdateAsync(Workshop workshop, CancellationToken cancellationToken = default)
    {
        dbContext.Workshops.Update(workshop);
        return Task.CompletedTask;
    }

    public Task UpdateMembershipAsync(WorkshopMembership membership, CancellationToken cancellationToken = default)
    {
        dbContext.WorkshopMemberships.Update(membership);
        return Task.CompletedTask;
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
