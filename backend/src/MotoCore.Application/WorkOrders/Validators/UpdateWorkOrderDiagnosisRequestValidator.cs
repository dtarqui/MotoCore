using FluentValidation;
using MotoCore.Application.WorkOrders.Models;

namespace MotoCore.Application.WorkOrders.Validators;

public sealed class UpdateWorkOrderDiagnosisRequestValidator : AbstractValidator<UpdateWorkOrderDiagnosisRequest>
{
    public UpdateWorkOrderDiagnosisRequestValidator()
    {
        RuleFor(x => x.Diagnosis)
            .NotEmpty()
            .WithMessage("Diagnosis is required.")
            .MaximumLength(2000)
            .WithMessage("Diagnosis cannot exceed 2000 characters.");
    }
}
