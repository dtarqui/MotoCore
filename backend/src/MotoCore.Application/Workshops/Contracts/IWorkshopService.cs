using MotoCore.Application.Common.Results;
using MotoCore.Application.Workshops.Models;

namespace MotoCore.Application.Workshops.Contracts;

public interface IWorkshopService
{
    Task<Result<WorkshopDto>> CreateWorkshopAsync(Guid ownerId, CreateWorkshopRequest request, CancellationToken cancellationToken = default);
    Task<Result<WorkshopDto>> GetWorkshopByIdAsync(Guid workshopId, Guid requestingUserId, CancellationToken cancellationToken = default);
    Task<Result<IReadOnlyList<WorkshopDto>>> GetUserWorkshopsAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<Result<IReadOnlyList<WorkshopMemberDto>>> GetWorkshopMembersAsync(Guid workshopId, Guid requestingUserId, CancellationToken cancellationToken = default);
    Task<Result> InviteUserToWorkshopAsync(Guid workshopId, Guid inviterId, InviteUserRequest request, CancellationToken cancellationToken = default);
    Task<Result> RemoveMemberAsync(Guid workshopId, Guid memberId, Guid requestingUserId, CancellationToken cancellationToken = default);
    Task<Result> UpdateMemberRoleAsync(Guid workshopId, Guid memberId, string newRole, Guid requestingUserId, CancellationToken cancellationToken = default);
}
