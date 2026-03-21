using FluentValidation;
using MotoCore.Application.Inventory.Models;

namespace MotoCore.Application.Inventory.Validators;

public sealed class UpdatePartRequestValidator : AbstractValidator<UpdatePartRequest>
{
    public UpdatePartRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .WithMessage("Name is required.")
            .MaximumLength(200)
            .WithMessage("Name cannot exceed 200 characters.");

        RuleFor(x => x.Description)
            .MaximumLength(1000)
            .When(x => !string.IsNullOrWhiteSpace(x.Description))
            .WithMessage("Description cannot exceed 1000 characters.");

        RuleFor(x => x.Brand)
            .MaximumLength(100)
            .When(x => !string.IsNullOrWhiteSpace(x.Brand))
            .WithMessage("Brand cannot exceed 100 characters.");

        RuleFor(x => x.Category)
            .MaximumLength(100)
            .When(x => !string.IsNullOrWhiteSpace(x.Category))
            .WithMessage("Category cannot exceed 100 characters.");

        RuleFor(x => x.MinimumStock)
            .GreaterThanOrEqualTo(0)
            .WithMessage("Minimum stock must be greater than or equal to 0.");

        RuleFor(x => x.MaximumStock)
            .GreaterThanOrEqualTo(0)
            .WithMessage("Maximum stock must be greater than or equal to 0.");

        RuleFor(x => x.UnitCost)
            .GreaterThanOrEqualTo(0)
            .WithMessage("Unit cost must be greater than or equal to 0.");

        RuleFor(x => x.SalePrice)
            .GreaterThanOrEqualTo(0)
            .WithMessage("Sale price must be greater than or equal to 0.");
    }
}
