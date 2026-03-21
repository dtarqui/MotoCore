namespace MotoCore.Domain.Inventory;

public sealed class Part
{
    public Guid Id { get; set; }
    public Guid WorkshopId { get; set; }
    public string PartNumber { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Brand { get; set; }
    public string? Category { get; set; }
    public int CurrentStock { get; set; }
    public int MinimumStock { get; set; }
    public int MaximumStock { get; set; }
    public decimal UnitCost { get; set; }
    public decimal SalePrice { get; set; }
    public string? Location { get; set; }
    public string? SupplierName { get; set; }
    public string? SupplierContact { get; set; }
    public string? Notes { get; set; }
    public bool IsActive { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? UpdatedAtUtc { get; set; }
}
