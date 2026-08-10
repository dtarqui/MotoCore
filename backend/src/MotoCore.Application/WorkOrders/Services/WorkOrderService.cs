using MotoCore.Application.Common.Results;
using MotoCore.Application.Motorcycles.Contracts;
using MotoCore.Application.WorkOrders.Contracts;
using MotoCore.Application.WorkOrders.Models;
using MotoCore.Application.Workshops.Contracts;
using MotoCore.Domain.Auth;
using MotoCore.Domain.WorkOrders;

namespace MotoCore.Application.WorkOrders.Services;

public sealed class WorkOrderService(
    IWorkOrderRepository workOrderRepository,
    IMotorcycleRepository motorcycleRepository,
    IWorkshopRepository workshopRepository) : IWorkOrderService
{
    public async Task<Result<WorkOrderDto>> CreateWorkOrderAsync(Guid workshopId, Guid requestingUserId, CreateWorkOrderRequest request, CancellationToken cancellationToken = default)
    {
        var membership = await workshopRepository.GetMembershipAsync(workshopId, requestingUserId, cancellationToken);
        if (membership is null || !membership.IsActive)
        {
            return Result<WorkOrderDto>.Failure("workorder.access_denied", "You don't have access to this workshop.");
        }

        if (!CanManageWorkOrders(membership.Role))
        {
            return Result<WorkOrderDto>.Failure("workorder.insufficient_permissions", "Only Owner and Receptionist can create work orders.");
        }

        var motorcycle = await motorcycleRepository.GetByIdAsync(request.MotorcycleId, cancellationToken);
        if (motorcycle is null || !motorcycle.IsActive)
        {
            return Result<WorkOrderDto>.Failure("workorder.motorcycle_not_found", "Motorcycle not found or inactive.");
        }

        if (motorcycle.WorkshopId != workshopId)
        {
            return Result<WorkOrderDto>.Failure("workorder.motorcycle_workshop_mismatch", "Motorcycle does not belong to this workshop.");
        }

        if (request.AssignedMechanicUserId.HasValue)
        {
            var mechanicMembership = await workshopRepository.GetMembershipAsync(workshopId, request.AssignedMechanicUserId.Value, cancellationToken);
            if (mechanicMembership is null || !mechanicMembership.IsActive)
            {
                return Result<WorkOrderDto>.Failure("workorder.mechanic_not_found", "Assigned mechanic is not a member of this workshop.");
            }
        }

        var orderNumber = await GenerateOrderNumberAsync(workshopId, cancellationToken);

        var workOrder = new WorkOrder
        {
            WorkshopId = workshopId,
            MotorcycleId = request.MotorcycleId,
            OrderNumber = orderNumber,
            Status = WorkOrderStatus.Pending,
            Description = request.Description.Trim(),
            CurrentMileage = request.CurrentMileage,
            EstimatedCost = request.EstimatedCost,
            FinalCost = 0,
            ScheduledDate = request.ScheduledDate,
            CreatedByUserId = requestingUserId,
            AssignedMechanicUserId = request.AssignedMechanicUserId,
            Notes = request.Notes?.Trim(),
            IsActive = true
        };

        await workOrderRepository.AddAsync(workOrder, cancellationToken);
        await workOrderRepository.SaveChangesAsync(cancellationToken);

        return Result<WorkOrderDto>.Success(MapToDto(workOrder));
    }

    public async Task<Result<WorkOrderDto>> GetWorkOrderByIdAsync(Guid workshopId, Guid workOrderId, Guid requestingUserId, CancellationToken cancellationToken = default)
    {
        var membership = await workshopRepository.GetMembershipAsync(workshopId, requestingUserId, cancellationToken);
        if (membership is null || !membership.IsActive)
        {
            return Result<WorkOrderDto>.Failure("workorder.access_denied", "You don't have access to this workshop.");
        }

        var workOrder = await workOrderRepository.GetByIdAsync(workOrderId, cancellationToken);
        if (workOrder is null || workOrder.WorkshopId != workshopId)
        {
            return Result<WorkOrderDto>.Failure("workorder.not_found", "Work order not found.");
        }

        return Result<WorkOrderDto>.Success(MapToDto(workOrder));
    }

    public async Task<Result<IReadOnlyList<WorkOrderDto>>> GetWorkshopWorkOrdersAsync(Guid workshopId, Guid requestingUserId, CancellationToken cancellationToken = default)
    {
        var membership = await workshopRepository.GetMembershipAsync(workshopId, requestingUserId, cancellationToken);
        if (membership is null || !membership.IsActive)
        {
            return Result<IReadOnlyList<WorkOrderDto>>.Failure("workorder.access_denied", "You don't have access to this workshop.");
        }

        var workOrders = await workOrderRepository.GetByWorkshopIdAsync(workshopId, cancellationToken);
        var dtos = workOrders.Select(MapToDto).ToList().AsReadOnly();

        return Result<IReadOnlyList<WorkOrderDto>>.Success(dtos);
    }

    public async Task<Result<IReadOnlyList<WorkOrderDto>>> GetMotorcycleWorkOrdersAsync(Guid workshopId, Guid motorcycleId, Guid requestingUserId, CancellationToken cancellationToken = default)
    {
        var membership = await workshopRepository.GetMembershipAsync(workshopId, requestingUserId, cancellationToken);
        if (membership is null || !membership.IsActive)
        {
            return Result<IReadOnlyList<WorkOrderDto>>.Failure("workorder.access_denied", "You don't have access to this workshop.");
        }

        var motorcycle = await motorcycleRepository.GetByIdAsync(motorcycleId, cancellationToken);
        if (motorcycle is null || motorcycle.WorkshopId != workshopId)
        {
            return Result<IReadOnlyList<WorkOrderDto>>.Failure("workorder.motorcycle_not_found", "Motorcycle not found in this workshop.");
        }

        var workOrders = await workOrderRepository.GetByMotorcycleIdAsync(motorcycleId, cancellationToken);
        var dtos = workOrders.Select(MapToDto).ToList().AsReadOnly();

        return Result<IReadOnlyList<WorkOrderDto>>.Success(dtos);
    }

    public async Task<Result<WorkOrderDto>> UpdateWorkOrderStatusAsync(Guid workshopId, Guid workOrderId, Guid requestingUserId, UpdateWorkOrderStatusRequest request, CancellationToken cancellationToken = default)
    {
        var membership = await workshopRepository.GetMembershipAsync(workshopId, requestingUserId, cancellationToken);
        if (membership is null || !membership.IsActive)
        {
            return Result<WorkOrderDto>.Failure("workorder.access_denied", "You don't have access to this workshop.");
        }

        if (!CanUpdateWorkOrder(membership.Role))
        {
            return Result<WorkOrderDto>.Failure("workorder.insufficient_permissions", "Only Owner and Mechanic can update work order status.");
        }

        var workOrder = await workOrderRepository.GetByIdAsync(workOrderId, cancellationToken);
        if (workOrder is null || workOrder.WorkshopId != workshopId)
        {
            return Result<WorkOrderDto>.Failure("workorder.not_found", "Work order not found.");
        }

        if (!WorkOrderStatus.IsValid(request.Status))
        {
            return Result<WorkOrderDto>.Failure("workorder.invalid_status", "Invalid work order status.");
        }

        workOrder.Status = request.Status;
        workOrder.UpdatedAtUtc = DateTimeOffset.UtcNow;

        if (request.Status == WorkOrderStatus.InRepair && !workOrder.StartedAtUtc.HasValue)
        {
            workOrder.StartedAtUtc = DateTimeOffset.UtcNow;
        }

        await workOrderRepository.UpdateAsync(workOrder, cancellationToken);
        await workOrderRepository.SaveChangesAsync(cancellationToken);

        return Result<WorkOrderDto>.Success(MapToDto(workOrder));
    }

    public async Task<Result<WorkOrderDto>> UpdateWorkOrderDiagnosisAsync(Guid workshopId, Guid workOrderId, Guid requestingUserId, UpdateWorkOrderDiagnosisRequest request, CancellationToken cancellationToken = default)
    {
        var membership = await workshopRepository.GetMembershipAsync(workshopId, requestingUserId, cancellationToken);
        if (membership is null || !membership.IsActive)
        {
            return Result<WorkOrderDto>.Failure("workorder.access_denied", "You don't have access to this workshop.");
        }

        if (!CanUpdateWorkOrder(membership.Role))
        {
            return Result<WorkOrderDto>.Failure("workorder.insufficient_permissions", "Only Owner and Mechanic can update work order diagnosis.");
        }

        var workOrder = await workOrderRepository.GetByIdAsync(workOrderId, cancellationToken);
        if (workOrder is null || workOrder.WorkshopId != workshopId)
        {
            return Result<WorkOrderDto>.Failure("workorder.not_found", "Work order not found.");
        }

        workOrder.Diagnosis = request.Diagnosis.Trim();
        workOrder.UpdatedAtUtc = DateTimeOffset.UtcNow;

        if (workOrder.Status == WorkOrderStatus.Pending)
        {
            workOrder.Status = WorkOrderStatus.InDiagnosis;
        }

        await workOrderRepository.UpdateAsync(workOrder, cancellationToken);
        await workOrderRepository.SaveChangesAsync(cancellationToken);

        return Result<WorkOrderDto>.Success(MapToDto(workOrder));
    }

    public async Task<Result<WorkOrderDto>> CloseWorkOrderAsync(Guid workshopId, Guid workOrderId, Guid requestingUserId, CloseWorkOrderRequest request, CancellationToken cancellationToken = default)
    {
        var membership = await workshopRepository.GetMembershipAsync(workshopId, requestingUserId, cancellationToken);
        if (membership is null || !membership.IsActive)
        {
            return Result<WorkOrderDto>.Failure("workorder.access_denied", "You don't have access to this workshop.");
        }

        if (!CanUpdateWorkOrder(membership.Role))
        {
            return Result<WorkOrderDto>.Failure("workorder.insufficient_permissions", "Only Owner and Mechanic can close work orders.");
        }

        var workOrder = await workOrderRepository.GetByIdAsync(workOrderId, cancellationToken);
        if (workOrder is null || workOrder.WorkshopId != workshopId)
        {
            return Result<WorkOrderDto>.Failure("workorder.not_found", "Work order not found.");
        }

        if (workOrder.Status == WorkOrderStatus.Completed || workOrder.Status == WorkOrderStatus.Delivered)
        {
            return Result<WorkOrderDto>.Failure("workorder.already_closed", "Work order is already closed.");
        }

        workOrder.Status = WorkOrderStatus.Completed;
        workOrder.FinalCost = request.FinalCost;
        workOrder.CompletedAtUtc = DateTimeOffset.UtcNow;
        
        if (!string.IsNullOrWhiteSpace(request.Notes))
        {
            workOrder.Notes = string.IsNullOrWhiteSpace(workOrder.Notes) 
                ? request.Notes.Trim() 
                : $"{workOrder.Notes}\n{request.Notes.Trim()}";
        }
        
        workOrder.UpdatedAtUtc = DateTimeOffset.UtcNow;

        await workOrderRepository.UpdateAsync(workOrder, cancellationToken);
        await workOrderRepository.SaveChangesAsync(cancellationToken);

        return Result<WorkOrderDto>.Success(MapToDto(workOrder));
    }

    public async Task<Result<WorkOrderDto>> DeliverWorkOrderAsync(Guid workshopId, Guid workOrderId, Guid requestingUserId, CancellationToken cancellationToken = default)
    {
        var membership = await workshopRepository.GetMembershipAsync(workshopId, requestingUserId, cancellationToken);
        if (membership is null || !membership.IsActive)
        {
            return Result<WorkOrderDto>.Failure("workorder.access_denied", "You don't have access to this workshop.");
        }

        if (!CanDeliverWorkOrder(membership.Role))
        {
            return Result<WorkOrderDto>.Failure("workorder.insufficient_permissions", "Only Owner and Receptionist can deliver work orders.");
        }

        var workOrder = await workOrderRepository.GetByIdAsync(workOrderId, cancellationToken);
        if (workOrder is null || workOrder.WorkshopId != workshopId)
        {
            return Result<WorkOrderDto>.Failure("workorder.not_found", "Work order not found.");
        }

        if (workOrder.Status != WorkOrderStatus.Completed)
        {
            return Result<WorkOrderDto>.Failure("workorder.not_completed", "Work order must be completed before delivery.");
        }

        workOrder.Status = WorkOrderStatus.Delivered;
        workOrder.DeliveredAtUtc = DateTimeOffset.UtcNow;
        workOrder.UpdatedAtUtc = DateTimeOffset.UtcNow;

        await workOrderRepository.UpdateAsync(workOrder, cancellationToken);
        await workOrderRepository.SaveChangesAsync(cancellationToken);

        return Result<WorkOrderDto>.Success(MapToDto(workOrder));
    }

    private async Task<string> GenerateOrderNumberAsync(Guid workshopId, CancellationToken cancellationToken)
    {
        var year = DateTime.UtcNow.Year;
        var prefix = $"WO-{year}-";
        var existingOrders = await workOrderRepository.GetByWorkshopIdAsync(workshopId, cancellationToken);
        var maxNumber = existingOrders
            .Where(wo => wo.OrderNumber.StartsWith(prefix))
            .Select(wo =>
            {
                var numberPart = wo.OrderNumber.Replace(prefix, "");
                return int.TryParse(numberPart, out var num) ? num : 0;
            })
            .DefaultIfEmpty(0)
            .Max();

        return $"{prefix}{(maxNumber + 1):D5}";
    }

    private static WorkOrderDto MapToDto(WorkOrder workOrder) =>
        new(
            workOrder.Id,
            workOrder.WorkshopId,
            workOrder.MotorcycleId,
            workOrder.OrderNumber,
            workOrder.Status,
            workOrder.Description,
            workOrder.Diagnosis,
            workOrder.CurrentMileage,
            workOrder.EstimatedCost,
            workOrder.FinalCost,
            workOrder.ScheduledDate,
            workOrder.StartedAtUtc,
            workOrder.CompletedAtUtc,
            workOrder.DeliveredAtUtc,
            workOrder.CreatedByUserId,
            workOrder.AssignedMechanicUserId,
            workOrder.Notes,
            workOrder.IsActive,
            workOrder.CreatedAtUtc);

    private static bool CanManageWorkOrders(string role) =>
        SystemRoles.IsOwner(role) || role == SystemRoles.Receptionist;

    private static bool CanUpdateWorkOrder(string role) =>
        SystemRoles.IsOwner(role) || role == SystemRoles.Mechanic;

    private static bool CanDeliverWorkOrder(string role) =>
        SystemRoles.IsOwner(role) || role == SystemRoles.Receptionist;
}
