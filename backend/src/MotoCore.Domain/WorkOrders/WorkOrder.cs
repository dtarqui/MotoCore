namespace MotoCore.Domain.WorkOrders;

public sealed class WorkOrder
{
    public Guid Id { get; set; }
    public Guid WorkshopId { get; set; }
    public Guid MotorcycleId { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public string Status { get; set; } = WorkOrderStatus.Pending;
    public string? Description { get; set; }
    public string? Diagnosis { get; set; }
    public int? CurrentMileage { get; set; }
    public decimal EstimatedCost { get; set; }
    public decimal FinalCost { get; set; }
    public DateTimeOffset? ScheduledDate { get; set; }
    public DateTimeOffset? StartedAtUtc { get; set; }
    public DateTimeOffset? CompletedAtUtc { get; set; }
    public DateTimeOffset? DeliveredAtUtc { get; set; }
    public Guid CreatedByUserId { get; set; }
    public Guid? AssignedMechanicUserId { get; set; }
    public string? Notes { get; set; }
    public bool IsActive { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? UpdatedAtUtc { get; set; }
}
