using FluentValidation;
using MotoCore.Application.Clients.Models;

namespace MotoCore.Application.Clients.Validators;

public sealed class UpdateClientRequestValidator : AbstractValidator<UpdateClientRequest>
{
    public UpdateClientRequestValidator()
    {
        RuleFor(x => x.FirstName)
            .NotEmpty().WithMessage("First name is required.")
            .MaximumLength(100).WithMessage("First name must not exceed 100 characters.");

        RuleFor(x => x.LastName)
            .NotEmpty().WithMessage("Last name is required.")
            .MaximumLength(100).WithMessage("Last name must not exceed 100 characters.");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress().WithMessage("Invalid email format.")
            .MaximumLength(256).WithMessage("Email must not exceed 256 characters.");

        RuleFor(x => x.Phone)
            .NotEmpty().WithMessage("Phone is required.")
            .MaximumLength(20).WithMessage("Phone must not exceed 20 characters.");

        RuleFor(x => x.SecondaryPhone)
            .MaximumLength(20).WithMessage("Secondary phone must not exceed 20 characters.")
            .When(x => !string.IsNullOrWhiteSpace(x.SecondaryPhone));

        RuleFor(x => x.Address)
            .MaximumLength(200).WithMessage("Address must not exceed 200 characters.")
            .When(x => !string.IsNullOrWhiteSpace(x.Address));

        RuleFor(x => x.City)
            .MaximumLength(100).WithMessage("City must not exceed 100 characters.")
            .When(x => !string.IsNullOrWhiteSpace(x.City));

        RuleFor(x => x.PostalCode)
            .MaximumLength(20).WithMessage("Postal code must not exceed 20 characters.")
            .When(x => !string.IsNullOrWhiteSpace(x.PostalCode));

        RuleFor(x => x.IdentificationNumber)
            .MaximumLength(50).WithMessage("Identification number must not exceed 50 characters.")
            .When(x => !string.IsNullOrWhiteSpace(x.IdentificationNumber));

        RuleFor(x => x.CompanyName)
            .MaximumLength(200).WithMessage("Company name must not exceed 200 characters.")
            .When(x => !string.IsNullOrWhiteSpace(x.CompanyName));

        RuleFor(x => x.TaxId)
            .MaximumLength(50).WithMessage("Tax ID must not exceed 50 characters.")
            .When(x => !string.IsNullOrWhiteSpace(x.TaxId));

        RuleFor(x => x.BirthDate)
            .LessThan(DateTimeOffset.UtcNow).WithMessage("Birth date must be in the past.")
            .When(x => x.BirthDate.HasValue);

        RuleFor(x => x.PreferredContactMethod)
            .MaximumLength(50).WithMessage("Preferred contact method must not exceed 50 characters.")
            .When(x => !string.IsNullOrWhiteSpace(x.PreferredContactMethod));

        RuleFor(x => x.Notes)
            .MaximumLength(1000).WithMessage("Notes must not exceed 1000 characters.")
            .When(x => !string.IsNullOrWhiteSpace(x.Notes));
    }
}
