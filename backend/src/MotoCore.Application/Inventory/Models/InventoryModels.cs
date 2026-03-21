namespace MotoCore.Application.Inventory.Models;

public sealed record PartDto(
    Guid Id,
    Guid WorkshopId,
    string PartNumber,
    string Name,
    string? Description,
    string? Brand,
    string? Category,
    int CurrentStock,
    int MinimumStock,
    int MaximumStock,
    decimal UnitCost,
    decimal SalePrice,
    string? Location,
    string? SupplierName,
    string? SupplierContact,
    string? Notes,
    bool IsActive,
    DateTimeOffset CreatedAtUtc);

public sealed record CreatePartRequest(
    string PartNumber,
    string Name,
    string? Description,
    string? Brand,
    string? Category,
    int InitialStock,
    int MinimumStock,
    int MaximumStock,
    decimal UnitCost,
    decimal SalePrice,
    string? Location,
    string? SupplierName,
    string? SupplierContact,
    string? Notes);

public sealed record UpdatePartRequest(
    string Name,
    string? Description,
    string? Brand,
    string? Category,
    int MinimumStock,
    int MaximumStock,
    decimal UnitCost,
    decimal SalePrice,
    string? Location,
    string? SupplierName,
    string? SupplierContact,
    string? Notes);

public sealed record PartMovementDto(
    Guid Id,
    Guid WorkshopId,
    Guid PartId,
    string MovementType,
    int Quantity,
    int PreviousStock,
    int NewStock,
    decimal? UnitCost,
    decimal? TotalCost,
    Guid? WorkOrderId,
    Guid CreatedByUserId,
    string? Reference,
    string? Notes,
    DateTimeOffset CreatedAtUtc);

public sealed record CreatePartMovementRequest(
    Guid PartId,
    string MovementType,
    int Quantity,
    decimal? UnitCost,
    Guid? WorkOrderId,
    string? Reference,
    string? Notes);
