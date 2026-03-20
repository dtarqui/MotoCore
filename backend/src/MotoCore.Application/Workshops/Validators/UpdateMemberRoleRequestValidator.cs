using FluentValidation;
using MotoCore.Application.Workshops.Models;
using MotoCore.Domain.Auth;

namespace MotoCore.Application.Workshops.Validators;

public sealed class UpdateMemberRoleRequestValidator : AbstractValidator<UpdateMemberRoleRequest>
{
    public UpdateMemberRoleRequestValidator()
    {
        RuleFor(x => x.Role)
            .NotEmpty().WithMessage("Role is required.")
            .Must(SystemRoles.IsSupported).WithMessage("Invalid role.")
            .Must(role => !SystemRoles.IsOwner(role)).WithMessage("Cannot assign Owner role to members.");
    }
}
