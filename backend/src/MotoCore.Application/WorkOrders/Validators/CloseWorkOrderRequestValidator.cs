using FluentValidation;
using MotoCore.Application.WorkOrders.Models;

namespace MotoCore.Application.WorkOrders.Validators;

public sealed class CloseWorkOrderRequestValidator : AbstractValidator<CloseWorkOrderRequest>
{
    public CloseWorkOrderRequestValidator()
    {
        RuleFor(x => x.FinalCost)
            .GreaterThanOrEqualTo(0)
            .WithMessage("Final cost must be greater than or equal to 0.");

        RuleFor(x => x.Notes)
            .MaximumLength(2000)
            .When(x => !string.IsNullOrWhiteSpace(x.Notes))
            .WithMessage("Notes cannot exceed 2000 characters.");
    }
}
