using FluentValidation;
using MotoCore.Application.Inventory.Models;
using MotoCore.Domain.Inventory;

namespace MotoCore.Application.Inventory.Validators;

public sealed class CreatePartMovementRequestValidator : AbstractValidator<CreatePartMovementRequest>
{
    public CreatePartMovementRequestValidator()
    {
        RuleFor(x => x.PartId)
            .NotEmpty()
            .WithMessage("Part ID is required.");

        RuleFor(x => x.MovementType)
            .NotEmpty()
            .WithMessage("Movement type is required.")
            .Must(PartMovementType.IsValid)
            .WithMessage($"Movement type must be one of: {string.Join(", ", PartMovementType.All)}.");

        RuleFor(x => x.Quantity)
            .GreaterThan(0)
            .WithMessage("Quantity must be greater than 0.");

        RuleFor(x => x.UnitCost)
            .GreaterThanOrEqualTo(0)
            .When(x => x.UnitCost.HasValue)
            .WithMessage("Unit cost must be greater than or equal to 0.");

        RuleFor(x => x.Reference)
            .MaximumLength(200)
            .When(x => !string.IsNullOrWhiteSpace(x.Reference))
            .WithMessage("Reference cannot exceed 200 characters.");

        RuleFor(x => x.Notes)
            .MaximumLength(1000)
            .When(x => !string.IsNullOrWhiteSpace(x.Notes))
            .WithMessage("Notes cannot exceed 1000 characters.");
    }
}
