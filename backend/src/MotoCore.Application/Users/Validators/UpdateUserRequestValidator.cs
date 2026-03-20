using FluentValidation;
using MotoCore.Application.Users.Models;
using MotoCore.Domain.Auth;

namespace MotoCore.Application.Users.Validators;

public sealed class UpdateUserRequestValidator : AbstractValidator<UpdateUserRequest>
{
    public UpdateUserRequestValidator()
    {
        RuleFor(x => x.FirstName)
            .NotEmpty()
            .WithMessage("First name is required.")
            .MaximumLength(100)
            .WithMessage("First name must not exceed 100 characters.");

        RuleFor(x => x.LastName)
            .NotEmpty()
            .WithMessage("Last name is required.")
            .MaximumLength(100)
            .WithMessage("Last name must not exceed 100 characters.");

        RuleFor(x => x.Role)
            .Must(role => string.IsNullOrWhiteSpace(role) || SystemRoles.IsSupported(role))
            .WithMessage($"Role must be one of: {string.Join(", ", SystemRoles.All)}.");
    }
}
