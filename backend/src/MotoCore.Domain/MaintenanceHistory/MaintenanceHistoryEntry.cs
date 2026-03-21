namespace MotoCore.Domain.MaintenanceHistory;

public sealed class MaintenanceHistoryEntry
{
    public Guid Id { get; set; }
    public Guid WorkshopId { get; set; }
    public Guid MotorcycleId { get; set; }
    public Guid ClientId { get; set; }
    public Guid? WorkOrderId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int? MileageAtService { get; set; }
    public decimal TotalCost { get; set; }
    public DateTimeOffset ServiceDate { get; set; }
    public Guid PerformedByUserId { get; set; }
    public string? ServicesPerformed { get; set; }
    public string? PartsUsed { get; set; }
    public string? Recommendations { get; set; }
    public string? Notes { get; set; }
    // TODO: Implementar sistema de almacenamiento de fotos (S3 u otro)
    // public string[]? PhotoUrls { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? UpdatedAtUtc { get; set; }
}
