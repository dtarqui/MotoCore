using MotoCore.Application.Common.Results;
using MotoCore.Application.WorkOrders.Models;

namespace MotoCore.Application.WorkOrders.Contracts;

public interface IWorkOrderService
{
    Task<Result<WorkOrderDto>> CreateWorkOrderAsync(Guid workshopId, Guid requestingUserId, CreateWorkOrderRequest request, CancellationToken cancellationToken = default);
    Task<Result<WorkOrderDto>> GetWorkOrderByIdAsync(Guid workshopId, Guid workOrderId, Guid requestingUserId, CancellationToken cancellationToken = default);
    Task<Result<IReadOnlyList<WorkOrderDto>>> GetWorkshopWorkOrdersAsync(Guid workshopId, Guid requestingUserId, CancellationToken cancellationToken = default);
    Task<Result<IReadOnlyList<WorkOrderDto>>> GetMotorcycleWorkOrdersAsync(Guid workshopId, Guid motorcycleId, Guid requestingUserId, CancellationToken cancellationToken = default);
    Task<Result<WorkOrderDto>> UpdateWorkOrderStatusAsync(Guid workshopId, Guid workOrderId, Guid requestingUserId, UpdateWorkOrderStatusRequest request, CancellationToken cancellationToken = default);
    Task<Result<WorkOrderDto>> UpdateWorkOrderDiagnosisAsync(Guid workshopId, Guid workOrderId, Guid requestingUserId, UpdateWorkOrderDiagnosisRequest request, CancellationToken cancellationToken = default);
    Task<Result<WorkOrderDto>> CloseWorkOrderAsync(Guid workshopId, Guid workOrderId, Guid requestingUserId, CloseWorkOrderRequest request, CancellationToken cancellationToken = default);
    Task<Result<WorkOrderDto>> DeliverWorkOrderAsync(Guid workshopId, Guid workOrderId, Guid requestingUserId, CancellationToken cancellationToken = default);
}
