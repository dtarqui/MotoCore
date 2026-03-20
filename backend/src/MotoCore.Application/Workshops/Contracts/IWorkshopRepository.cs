using MotoCore.Domain.Workshops;

namespace MotoCore.Application.Workshops.Contracts;

public interface IWorkshopRepository
{
    Task<Workshop?> GetByIdAsync(Guid workshopId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Workshop>> GetByOwnerIdAsync(Guid ownerId, CancellationToken cancellationToken = default);
    Task<WorkshopMembership?> GetMembershipAsync(Guid workshopId, Guid userId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<WorkshopMembership>> GetMembersAsync(Guid workshopId, CancellationToken cancellationToken = default);
    Task AddAsync(Workshop workshop, CancellationToken cancellationToken = default);
    Task AddMembershipAsync(WorkshopMembership membership, CancellationToken cancellationToken = default);
    Task UpdateAsync(Workshop workshop, CancellationToken cancellationToken = default);
    Task UpdateMembershipAsync(WorkshopMembership membership, CancellationToken cancellationToken = default);
    Task DeleteAsync(Workshop workshop, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
