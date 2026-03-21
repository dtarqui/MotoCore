using FluentValidation;
using MotoCore.Application.MaintenanceHistory.Models;

namespace MotoCore.Application.MaintenanceHistory.Validators;

public sealed class CreateMaintenanceHistoryEntryRequestValidator : AbstractValidator<CreateMaintenanceHistoryEntryRequest>
{
    public CreateMaintenanceHistoryEntryRequestValidator()
    {
        RuleFor(x => x.MotorcycleId)
            .NotEmpty()
            .WithMessage("Motorcycle ID is required.");

        RuleFor(x => x.Title)
            .NotEmpty()
            .WithMessage("Title is required.")
            .MaximumLength(200)
            .WithMessage("Title cannot exceed 200 characters.");

        RuleFor(x => x.Description)
            .NotEmpty()
            .WithMessage("Description is required.")
            .MaximumLength(2000)
            .WithMessage("Description cannot exceed 2000 characters.");

        RuleFor(x => x.MileageAtService)
            .GreaterThanOrEqualTo(0)
            .When(x => x.MileageAtService.HasValue)
            .WithMessage("Mileage must be greater than or equal to 0.");

        RuleFor(x => x.TotalCost)
            .GreaterThanOrEqualTo(0)
            .WithMessage("Total cost must be greater than or equal to 0.");

        RuleFor(x => x.ServiceDate)
            .NotEmpty()
            .WithMessage("Service date is required.")
            .LessThanOrEqualTo(DateTimeOffset.UtcNow)
            .WithMessage("Service date cannot be in the future.");

        RuleFor(x => x.ServicesPerformed)
            .MaximumLength(2000)
            .When(x => !string.IsNullOrWhiteSpace(x.ServicesPerformed))
            .WithMessage("Services performed cannot exceed 2000 characters.");

        RuleFor(x => x.PartsUsed)
            .MaximumLength(2000)
            .When(x => !string.IsNullOrWhiteSpace(x.PartsUsed))
            .WithMessage("Parts used cannot exceed 2000 characters.");

        RuleFor(x => x.Recommendations)
            .MaximumLength(2000)
            .When(x => !string.IsNullOrWhiteSpace(x.Recommendations))
            .WithMessage("Recommendations cannot exceed 2000 characters.");

        RuleFor(x => x.Notes)
            .MaximumLength(2000)
            .When(x => !string.IsNullOrWhiteSpace(x.Notes))
            .WithMessage("Notes cannot exceed 2000 characters.");
    }
}
