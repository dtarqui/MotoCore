using FluentValidation;
using MotoCore.Application.Workshops.Models;
using MotoCore.Domain.Auth;

namespace MotoCore.Application.Workshops.Validators;

public sealed class InviteUserRequestValidator : AbstractValidator<InviteUserRequest>
{
    public InviteUserRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress().WithMessage("Invalid email address.")
            .MaximumLength(256).WithMessage("Email cannot exceed 256 characters.");

        RuleFor(x => x.Role)
            .NotEmpty().WithMessage("Role is required.")
            .Must(SystemRoles.IsSupported).WithMessage("Invalid role.")
            .Must(role => !SystemRoles.IsOwner(role)).WithMessage("Cannot invite users as Owner.");
    }
}
