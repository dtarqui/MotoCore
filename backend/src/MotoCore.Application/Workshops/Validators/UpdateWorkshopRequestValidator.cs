using FluentValidation;
using MotoCore.Application.Workshops.Models;

namespace MotoCore.Application.Workshops.Validators;

public sealed class UpdateWorkshopRequestValidator : AbstractValidator<UpdateWorkshopRequest>
{
    public UpdateWorkshopRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Workshop name is required.")
            .MaximumLength(200).WithMessage("Workshop name cannot exceed 200 characters.");

        RuleFor(x => x.Description)
            .MaximumLength(1000).WithMessage("Description cannot exceed 1000 characters.")
            .When(x => !string.IsNullOrWhiteSpace(x.Description));

        RuleFor(x => x.Address)
            .MaximumLength(500).WithMessage("Address cannot exceed 500 characters.")
            .When(x => !string.IsNullOrWhiteSpace(x.Address));

        RuleFor(x => x.PhoneNumber)
            .MaximumLength(20).WithMessage("Phone number cannot exceed 20 characters.")
            .When(x => !string.IsNullOrWhiteSpace(x.PhoneNumber));

        RuleFor(x => x.Email)
            .EmailAddress().WithMessage("Invalid email address.")
            .MaximumLength(256).WithMessage("Email cannot exceed 256 characters.")
            .When(x => !string.IsNullOrWhiteSpace(x.Email));
    }
}
