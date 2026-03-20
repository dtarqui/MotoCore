using MotoCore.Application.Auth.Contracts;
using MotoCore.Application.Common.Results;
using MotoCore.Application.Workshops.Contracts;
using MotoCore.Application.Workshops.Models;
using MotoCore.Domain.Auth;
using MotoCore.Domain.Workshops;
using System.Net.Mail;

namespace MotoCore.Application.Workshops.Services;

public sealed class WorkshopService(
    IWorkshopRepository workshopRepository,
    IUserIdentityRepository userIdentityRepository) : IWorkshopService
{
    public async Task<Result<WorkshopDto>> CreateWorkshopAsync(Guid ownerId, CreateWorkshopRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return Result<WorkshopDto>.Failure("workshop.invalid_name", "Workshop name is required.");
        }

        var owner = await userIdentityRepository.GetByIdAsync(ownerId, cancellationToken);
        if (owner is null)
        {
            return Result<WorkshopDto>.Failure("workshop.owner_not_found", "Owner user not found.");
        }

        var workshop = new Workshop
        {
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            Address = request.Address?.Trim(),
            PhoneNumber = request.PhoneNumber?.Trim(),
            Email = request.Email?.Trim(),
            OwnerId = ownerId,
            IsActive = true,
        };

        await workshopRepository.AddAsync(workshop, cancellationToken);

        var ownerMembership = new WorkshopMembership
        {
            WorkshopId = workshop.Id,
            UserAccountId = ownerId,
            Role = SystemRoles.Owner,
            IsActive = true,
        };

        await workshopRepository.AddMembershipAsync(ownerMembership, cancellationToken);
        await workshopRepository.SaveChangesAsync(cancellationToken);

        return Result<WorkshopDto>.Success(MapToDto(workshop));
    }

    public async Task<Result<WorkshopDto>> GetWorkshopByIdAsync(Guid workshopId, Guid requestingUserId, CancellationToken cancellationToken = default)
    {
        var membership = await workshopRepository.GetMembershipAsync(workshopId, requestingUserId, cancellationToken);
        if (membership is null || !membership.IsActive)
        {
            return Result<WorkshopDto>.Failure("workshop.access_denied", "You don't have access to this workshop.");
        }

        var workshop = await workshopRepository.GetByIdAsync(workshopId, cancellationToken);
        if (workshop is null)
        {
            return Result<WorkshopDto>.Failure("workshop.not_found", "Workshop not found.");
        }

        return Result<WorkshopDto>.Success(MapToDto(workshop));
    }

    public async Task<Result<IReadOnlyList<WorkshopDto>>> GetUserWorkshopsAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var userWorkshops = await workshopRepository.GetByOwnerIdAsync(userId, cancellationToken);
        var dtos = userWorkshops.Select(MapToDto).ToList().AsReadOnly();
        return Result<IReadOnlyList<WorkshopDto>>.Success(dtos);
    }

    public async Task<Result<WorkshopDto>> UpdateWorkshopAsync(Guid workshopId, Guid requestingUserId, UpdateWorkshopRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return Result<WorkshopDto>.Failure("workshop.invalid_name", "Workshop name is required.");
        }

        var workshop = await workshopRepository.GetByIdAsync(workshopId, cancellationToken);
        if (workshop is null)
        {
            return Result<WorkshopDto>.Failure("workshop.not_found", "Workshop not found.");
        }

        if (workshop.OwnerId != requestingUserId)
        {
            return Result<WorkshopDto>.Failure("workshop.access_denied", "Only the workshop owner can update it.");
        }

        workshop.Name = request.Name.Trim();
        workshop.Description = request.Description?.Trim();
        workshop.Address = request.Address?.Trim();
        workshop.PhoneNumber = request.PhoneNumber?.Trim();
        workshop.Email = request.Email?.Trim();
        workshop.UpdatedAtUtc = DateTimeOffset.UtcNow;

        await workshopRepository.UpdateAsync(workshop, cancellationToken);
        await workshopRepository.SaveChangesAsync(cancellationToken);

        return Result<WorkshopDto>.Success(MapToDto(workshop));
    }

    public async Task<Result> DeleteWorkshopAsync(Guid workshopId, Guid requestingUserId, CancellationToken cancellationToken = default)
    {
        var workshop = await workshopRepository.GetByIdAsync(workshopId, cancellationToken);
        if (workshop is null)
        {
            return Result.Failure("workshop.not_found", "Workshop not found.");
        }

        if (workshop.OwnerId != requestingUserId)
        {
            return Result.Failure("workshop.access_denied", "Only the workshop owner can delete it.");
        }

        await workshopRepository.DeleteAsync(workshop, cancellationToken);
        await workshopRepository.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }

    public async Task<Result<IReadOnlyList<WorkshopMemberDto>>> GetWorkshopMembersAsync(Guid workshopId, Guid requestingUserId, CancellationToken cancellationToken = default)
    {
        var membership = await workshopRepository.GetMembershipAsync(workshopId, requestingUserId, cancellationToken);
        if (membership is null || !membership.IsActive)
        {
            return Result<IReadOnlyList<WorkshopMemberDto>>.Failure("workshop.access_denied", "You don't have access to this workshop.");
        }

        var members = await workshopRepository.GetMembersAsync(workshopId, cancellationToken);
        var dtos = members.Select(m => new WorkshopMemberDto(
            m.Id,
            m.UserAccountId,
            m.UserAccount.Email,
            m.UserAccount.FirstName,
            m.UserAccount.LastName,
            m.Role,
            m.IsActive,
            m.JoinedAtUtc)).ToList().AsReadOnly();

        return Result<IReadOnlyList<WorkshopMemberDto>>.Success(dtos);
    }

    public async Task<Result> InviteUserToWorkshopAsync(Guid workshopId, Guid inviterId, InviteUserRequest request, CancellationToken cancellationToken = default)
    {
        var inviterMembership = await workshopRepository.GetMembershipAsync(workshopId, inviterId, cancellationToken);
        if (inviterMembership is null || !inviterMembership.IsActive)
        {
            return Result.Failure("workshop.access_denied", "You don't have access to this workshop.");
        }

        if (!SystemRoles.CanInviteMembers(inviterMembership.Role))
        {
            return Result.Failure("workshop.insufficient_permissions", "Only workshop owners can invite members.");
        }

        if (!SystemRoles.IsSupported(request.Role) || SystemRoles.IsOwner(request.Role))
        {
            return Result.Failure("workshop.invalid_role", "Invalid role for invitation.");
        }

        if (!IsValidEmail(request.Email))
        {
            return Result.Failure("workshop.invalid_email", "Invalid email address.");
        }

        var normalizedEmail = NormalizeEmail(request.Email);
        var targetUser = await userIdentityRepository.GetByEmailAsync(normalizedEmail, cancellationToken);

        if (targetUser is null)
        {
            return Result.Failure("workshop.user_not_found", "User with this email does not exist.");
        }

        var existingMembership = await workshopRepository.GetMembershipAsync(workshopId, targetUser.Id, cancellationToken);
        if (existingMembership is not null)
        {
            return Result.Failure("workshop.user_already_member", "User is already a member of this workshop.");
        }

        var newMembership = new WorkshopMembership
        {
            WorkshopId = workshopId,
            UserAccountId = targetUser.Id,
            Role = request.Role,
            IsActive = true,
        };

        await workshopRepository.AddMembershipAsync(newMembership, cancellationToken);
        await workshopRepository.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }

    public async Task<Result> RemoveMemberAsync(Guid workshopId, Guid memberId, Guid requestingUserId, CancellationToken cancellationToken = default)
    {
        var requesterMembership = await workshopRepository.GetMembershipAsync(workshopId, requestingUserId, cancellationToken);
        if (requesterMembership is null || !requesterMembership.IsActive)
        {
            return Result.Failure("workshop.access_denied", "You don't have access to this workshop.");
        }

        if (!SystemRoles.CanInviteMembers(requesterMembership.Role))
        {
            return Result.Failure("workshop.insufficient_permissions", "Only workshop owners can remove members.");
        }

        var memberMembership = await workshopRepository.GetMembershipAsync(workshopId, memberId, cancellationToken);
        if (memberMembership is null)
        {
            return Result.Failure("workshop.member_not_found", "Member not found in this workshop.");
        }

        if (SystemRoles.IsOwner(memberMembership.Role))
        {
            return Result.Failure("workshop.cannot_remove_owner", "Cannot remove the workshop owner.");
        }

        memberMembership.IsActive = false;
        memberMembership.UpdatedAtUtc = DateTimeOffset.UtcNow;

        await workshopRepository.UpdateMembershipAsync(memberMembership, cancellationToken);
        await workshopRepository.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }

    public async Task<Result> UpdateMemberRoleAsync(Guid workshopId, Guid memberId, string newRole, Guid requestingUserId, CancellationToken cancellationToken = default)
    {
        var requesterMembership = await workshopRepository.GetMembershipAsync(workshopId, requestingUserId, cancellationToken);
        if (requesterMembership is null || !requesterMembership.IsActive)
        {
            return Result.Failure("workshop.access_denied", "You don't have access to this workshop.");
        }

        if (!SystemRoles.CanInviteMembers(requesterMembership.Role))
        {
            return Result.Failure("workshop.insufficient_permissions", "Only workshop owners can change member roles.");
        }

        if (!SystemRoles.IsSupported(newRole) || SystemRoles.IsOwner(newRole))
        {
            return Result.Failure("workshop.invalid_role", "Invalid role.");
        }

        var memberMembership = await workshopRepository.GetMembershipAsync(workshopId, memberId, cancellationToken);
        if (memberMembership is null)
        {
            return Result.Failure("workshop.member_not_found", "Member not found in this workshop.");
        }

        if (SystemRoles.IsOwner(memberMembership.Role))
        {
            return Result.Failure("workshop.cannot_change_owner_role", "Cannot change the role of the workshop owner.");
        }

        memberMembership.Role = newRole;
        memberMembership.UpdatedAtUtc = DateTimeOffset.UtcNow;

        await workshopRepository.UpdateMembershipAsync(memberMembership, cancellationToken);
        await workshopRepository.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }

    private static WorkshopDto MapToDto(Workshop workshop) =>
        new(
            workshop.Id,
            workshop.Name,
            workshop.Description,
            workshop.Address,
            workshop.PhoneNumber,
            workshop.Email,
            workshop.OwnerId,
            workshop.IsActive,
            workshop.CreatedAtUtc);

    private static string NormalizeEmail(string email) => email.Trim().ToUpperInvariant();

    private static bool IsValidEmail(string email)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            return false;
        }

        try
        {
            var mailAddress = new MailAddress(email);
            return mailAddress.Address == email.Trim();
        }
        catch
        {
            return false;
        }
    }
}
