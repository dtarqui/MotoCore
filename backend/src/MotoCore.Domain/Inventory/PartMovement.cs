namespace MotoCore.Domain.Inventory;

public static class PartMovementType
{
    public const string Purchase = "Purchase";
    public const string Sale = "Sale";
    public const string Adjustment = "Adjustment";
    public const string Return = "Return";
    public const string Transfer = "Transfer";
    public const string Damaged = "Damaged";

    public static readonly IReadOnlyList<string> All = new[]
    {
        Purchase,
        Sale,
        Adjustment,
        Return,
        Transfer,
        Damaged
    };

    public static bool IsValid(string type) =>
        All.Contains(type, StringComparer.OrdinalIgnoreCase);
}

public sealed class PartMovement
{
    public Guid Id { get; set; }
    public Guid WorkshopId { get; set; }
    public Guid PartId { get; set; }
    public string MovementType { get; set; } = PartMovementType.Purchase;
    public int Quantity { get; set; }
    public int PreviousStock { get; set; }
    public int NewStock { get; set; }
    public decimal? UnitCost { get; set; }
    public decimal? TotalCost { get; set; }
    public Guid? WorkOrderId { get; set; }
    public Guid CreatedByUserId { get; set; }
    public string? Reference { get; set; }
    public string? Notes { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
}
