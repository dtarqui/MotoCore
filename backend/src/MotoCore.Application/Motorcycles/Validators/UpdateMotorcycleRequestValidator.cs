using FluentValidation;
using MotoCore.Application.Motorcycles.Models;

namespace MotoCore.Application.Motorcycles.Validators;

public sealed class UpdateMotorcycleRequestValidator : AbstractValidator<UpdateMotorcycleRequest>
{
    public UpdateMotorcycleRequestValidator()
    {
        RuleFor(x => x.Brand)
            .NotEmpty()
            .WithMessage("Brand is required.")
            .MaximumLength(100)
            .WithMessage("Brand cannot exceed 100 characters.");

        RuleFor(x => x.Model)
            .NotEmpty()
            .WithMessage("Model is required.")
            .MaximumLength(100)
            .WithMessage("Model cannot exceed 100 characters.");

        RuleFor(x => x.Year)
            .InclusiveBetween(1900, DateTime.Now.Year + 1)
            .WithMessage($"Year must be between 1900 and {DateTime.Now.Year + 1}.");

        RuleFor(x => x.LicensePlate)
            .NotEmpty()
            .WithMessage("License plate is required.")
            .MaximumLength(20)
            .WithMessage("License plate cannot exceed 20 characters.");

        RuleFor(x => x.Vin)
            .MaximumLength(50)
            .WithMessage("VIN cannot exceed 50 characters.")
            .When(x => !string.IsNullOrWhiteSpace(x.Vin));

        RuleFor(x => x.Color)
            .MaximumLength(50)
            .WithMessage("Color cannot exceed 50 characters.")
            .When(x => !string.IsNullOrWhiteSpace(x.Color));

        RuleFor(x => x.Mileage)
            .GreaterThanOrEqualTo(0)
            .WithMessage("Mileage cannot be negative.")
            .When(x => x.Mileage.HasValue);

        RuleFor(x => x.EngineSize)
            .MaximumLength(50)
            .WithMessage("Engine size cannot exceed 50 characters.")
            .When(x => !string.IsNullOrWhiteSpace(x.EngineSize));

        RuleFor(x => x.Notes)
            .MaximumLength(2000)
            .WithMessage("Notes cannot exceed 2000 characters.")
            .When(x => !string.IsNullOrWhiteSpace(x.Notes));
    }
}
