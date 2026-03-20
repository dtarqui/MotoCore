using FluentValidation;
using MotoCore.Application.Users.Models;
using MotoCore.Domain.Auth;

namespace MotoCore.Application.Users.Validators;

public sealed class UpdateUserRoleRequestValidator : AbstractValidator<UpdateUserRoleRequest>
{
    public UpdateUserRoleRequestValidator()
    {
        RuleFor(x => x.Role)
            .NotEmpty()
            .WithMessage("Role is required.")
            .Must(SystemRoles.IsSupported)
            .WithMessage($"Role must be one of: {string.Join(", ", SystemRoles.All)}.");
    }
}
