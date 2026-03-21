using FluentValidation;
using MotoCore.Application.WorkOrders.Models;

namespace MotoCore.Application.WorkOrders.Validators;

public sealed class CreateWorkOrderRequestValidator : AbstractValidator<CreateWorkOrderRequest>
{
    public CreateWorkOrderRequestValidator()
    {
        RuleFor(x => x.MotorcycleId)
            .NotEmpty()
            .WithMessage("Motorcycle ID is required.");

        RuleFor(x => x.Description)
            .NotEmpty()
            .WithMessage("Description is required.")
            .MaximumLength(2000)
            .WithMessage("Description cannot exceed 2000 characters.");

        RuleFor(x => x.EstimatedCost)
            .GreaterThanOrEqualTo(0)
            .WithMessage("Estimated cost must be greater than or equal to 0.");

        RuleFor(x => x.CurrentMileage)
            .GreaterThanOrEqualTo(0)
            .When(x => x.CurrentMileage.HasValue)
            .WithMessage("Current mileage must be greater than or equal to 0.");

        RuleFor(x => x.ScheduledDate)
            .GreaterThanOrEqualTo(DateTimeOffset.UtcNow.Date)
            .When(x => x.ScheduledDate.HasValue)
            .WithMessage("Scheduled date cannot be in the past.");

        RuleFor(x => x.Notes)
            .MaximumLength(2000)
            .When(x => !string.IsNullOrWhiteSpace(x.Notes))
            .WithMessage("Notes cannot exceed 2000 characters.");
    }
}
