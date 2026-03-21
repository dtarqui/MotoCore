using FluentValidation;
using MotoCore.Application.WorkOrders.Models;
using MotoCore.Domain.WorkOrders;

namespace MotoCore.Application.WorkOrders.Validators;

public sealed class UpdateWorkOrderStatusRequestValidator : AbstractValidator<UpdateWorkOrderStatusRequest>
{
    public UpdateWorkOrderStatusRequestValidator()
    {
        RuleFor(x => x.Status)
            .NotEmpty()
            .WithMessage("Status is required.")
            .Must(WorkOrderStatus.IsValid)
            .WithMessage($"Status must be one of: {string.Join(", ", WorkOrderStatus.All)}.");
    }
}
