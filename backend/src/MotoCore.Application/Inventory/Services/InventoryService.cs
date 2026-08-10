using MotoCore.Application.Common.Results;
using MotoCore.Application.Inventory.Contracts;
using MotoCore.Application.Inventory.Models;
using MotoCore.Application.Workshops.Contracts;
using MotoCore.Domain.Auth;
using MotoCore.Domain.Inventory;

namespace MotoCore.Application.Inventory.Services;

public sealed class InventoryService(
    IPartRepository partRepository,
    IPartMovementRepository partMovementRepository,
    IWorkshopRepository workshopRepository) : IInventoryService
{
    public async Task<Result<PartDto>> CreatePartAsync(Guid workshopId, Guid requestingUserId, CreatePartRequest request, CancellationToken cancellationToken = default)
    {
        var membership = await workshopRepository.GetMembershipAsync(workshopId, requestingUserId, cancellationToken);
        if (membership is null || !membership.IsActive)
        {
            return Result<PartDto>.Failure("inventory.access_denied", "You don't have access to this workshop.");
        }

        if (!CanManageParts(membership.Role))
        {
            return Result<PartDto>.Failure("inventory.insufficient_permissions", "Only Owner and Receptionist can create parts.");
        }

        var normalizedPartNumber = request.PartNumber.Trim().ToUpperInvariant();
        var existingPart = await partRepository.GetByPartNumberAsync(workshopId, normalizedPartNumber, cancellationToken);
        if (existingPart is not null)
        {
            return Result<PartDto>.Failure("inventory.part_number_exists", "A part with this part number already exists in this workshop.");
        }

        var part = new Part
        {
            WorkshopId = workshopId,
            PartNumber = normalizedPartNumber,
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            Brand = request.Brand?.Trim(),
            Category = request.Category?.Trim(),
            CurrentStock = request.InitialStock,
            MinimumStock = request.MinimumStock,
            MaximumStock = request.MaximumStock,
            UnitCost = request.UnitCost,
            SalePrice = request.SalePrice,
            Location = request.Location?.Trim(),
            SupplierName = request.SupplierName?.Trim(),
            SupplierContact = request.SupplierContact?.Trim(),
            Notes = request.Notes?.Trim(),
            IsActive = true
        };

        await partRepository.AddAsync(part, cancellationToken);
        await partRepository.SaveChangesAsync(cancellationToken);

        if (request.InitialStock > 0)
        {
            var movement = new PartMovement
            {
                WorkshopId = workshopId,
                PartId = part.Id,
                MovementType = PartMovementType.Purchase,
                Quantity = request.InitialStock,
                PreviousStock = 0,
                NewStock = request.InitialStock,
                UnitCost = request.UnitCost,
                TotalCost = request.UnitCost * request.InitialStock,
                CreatedByUserId = requestingUserId,
                Reference = "Initial stock",
                Notes = "Initial inventory stock"
            };

            await partMovementRepository.AddAsync(movement, cancellationToken);
            await partMovementRepository.SaveChangesAsync(cancellationToken);
        }

        return Result<PartDto>.Success(MapPartToDto(part));
    }

    public async Task<Result<PartDto>> GetPartByIdAsync(Guid workshopId, Guid partId, Guid requestingUserId, CancellationToken cancellationToken = default)
    {
        var membership = await workshopRepository.GetMembershipAsync(workshopId, requestingUserId, cancellationToken);
        if (membership is null || !membership.IsActive)
        {
            return Result<PartDto>.Failure("inventory.access_denied", "You don't have access to this workshop.");
        }

        var part = await partRepository.GetByIdAsync(partId, cancellationToken);
        if (part is null || part.WorkshopId != workshopId)
        {
            return Result<PartDto>.Failure("inventory.part_not_found", "Part not found.");
        }

        return Result<PartDto>.Success(MapPartToDto(part));
    }

    public async Task<Result<IReadOnlyList<PartDto>>> GetWorkshopPartsAsync(Guid workshopId, Guid requestingUserId, CancellationToken cancellationToken = default)
    {
        var membership = await workshopRepository.GetMembershipAsync(workshopId, requestingUserId, cancellationToken);
        if (membership is null || !membership.IsActive)
        {
            return Result<IReadOnlyList<PartDto>>.Failure("inventory.access_denied", "You don't have access to this workshop.");
        }

        var parts = await partRepository.GetByWorkshopIdAsync(workshopId, cancellationToken);
        var dtos = parts.Select(MapPartToDto).ToList().AsReadOnly();

        return Result<IReadOnlyList<PartDto>>.Success(dtos);
    }

    public async Task<Result<IReadOnlyList<PartDto>>> GetLowStockPartsAsync(Guid workshopId, Guid requestingUserId, CancellationToken cancellationToken = default)
    {
        var membership = await workshopRepository.GetMembershipAsync(workshopId, requestingUserId, cancellationToken);
        if (membership is null || !membership.IsActive)
        {
            return Result<IReadOnlyList<PartDto>>.Failure("inventory.access_denied", "You don't have access to this workshop.");
        }

        if (!CanManageParts(membership.Role))
        {
            return Result<IReadOnlyList<PartDto>>.Failure("inventory.insufficient_permissions", "Only Owner and Receptionist can view low stock parts.");
        }

        var parts = await partRepository.GetLowStockPartsAsync(workshopId, cancellationToken);
        var dtos = parts.Select(MapPartToDto).ToList().AsReadOnly();

        return Result<IReadOnlyList<PartDto>>.Success(dtos);
    }

    public async Task<Result<PartDto>> UpdatePartAsync(Guid workshopId, Guid partId, Guid requestingUserId, UpdatePartRequest request, CancellationToken cancellationToken = default)
    {
        var membership = await workshopRepository.GetMembershipAsync(workshopId, requestingUserId, cancellationToken);
        if (membership is null || !membership.IsActive)
        {
            return Result<PartDto>.Failure("inventory.access_denied", "You don't have access to this workshop.");
        }

        if (!CanManageParts(membership.Role))
        {
            return Result<PartDto>.Failure("inventory.insufficient_permissions", "Only Owner and Receptionist can update parts.");
        }

        var part = await partRepository.GetByIdAsync(partId, cancellationToken);
        if (part is null || part.WorkshopId != workshopId)
        {
            return Result<PartDto>.Failure("inventory.part_not_found", "Part not found.");
        }

        part.Name = request.Name.Trim();
        part.Description = request.Description?.Trim();
        part.Brand = request.Brand?.Trim();
        part.Category = request.Category?.Trim();
        part.MinimumStock = request.MinimumStock;
        part.MaximumStock = request.MaximumStock;
        part.UnitCost = request.UnitCost;
        part.SalePrice = request.SalePrice;
        part.Location = request.Location?.Trim();
        part.SupplierName = request.SupplierName?.Trim();
        part.SupplierContact = request.SupplierContact?.Trim();
        part.Notes = request.Notes?.Trim();
        part.UpdatedAtUtc = DateTimeOffset.UtcNow;

        await partRepository.UpdateAsync(part, cancellationToken);
        await partRepository.SaveChangesAsync(cancellationToken);

        return Result<PartDto>.Success(MapPartToDto(part));
    }

    public async Task<Result> DeletePartAsync(Guid workshopId, Guid partId, Guid requestingUserId, CancellationToken cancellationToken = default)
    {
        var membership = await workshopRepository.GetMembershipAsync(workshopId, requestingUserId, cancellationToken);
        if (membership is null || !membership.IsActive)
        {
            return Result.Failure("inventory.access_denied", "You don't have access to this workshop.");
        }

        if (!SystemRoles.IsOwner(membership.Role))
        {
            return Result.Failure("inventory.insufficient_permissions", "Only Owner can delete parts.");
        }

        var part = await partRepository.GetByIdAsync(partId, cancellationToken);
        if (part is null || part.WorkshopId != workshopId)
        {
            return Result.Failure("inventory.part_not_found", "Part not found.");
        }

        part.IsActive = false;
        part.UpdatedAtUtc = DateTimeOffset.UtcNow;

        await partRepository.UpdateAsync(part, cancellationToken);
        await partRepository.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }

    public async Task<Result<PartMovementDto>> CreatePartMovementAsync(Guid workshopId, Guid requestingUserId, CreatePartMovementRequest request, CancellationToken cancellationToken = default)
    {
        var membership = await workshopRepository.GetMembershipAsync(workshopId, requestingUserId, cancellationToken);
        if (membership is null || !membership.IsActive)
        {
            return Result<PartMovementDto>.Failure("inventory.access_denied", "You don't have access to this workshop.");
        }

        var part = await partRepository.GetByIdAsync(request.PartId, cancellationToken);
        if (part is null || part.WorkshopId != workshopId)
        {
            return Result<PartMovementDto>.Failure("inventory.part_not_found", "Part not found.");
        }

        if (!PartMovementType.IsValid(request.MovementType))
        {
            return Result<PartMovementDto>.Failure("inventory.invalid_movement_type", "Invalid movement type.");
        }

        var previousStock = part.CurrentStock;
        var newStock = CalculateNewStock(previousStock, request.MovementType, request.Quantity);

        if (newStock < 0)
        {
            return Result<PartMovementDto>.Failure("inventory.insufficient_stock", "Insufficient stock for this operation.");
        }

        var movement = new PartMovement
        {
            WorkshopId = workshopId,
            PartId = request.PartId,
            MovementType = request.MovementType,
            Quantity = request.Quantity,
            PreviousStock = previousStock,
            NewStock = newStock,
            UnitCost = request.UnitCost,
            TotalCost = request.UnitCost.HasValue ? request.UnitCost.Value * request.Quantity : null,
            WorkOrderId = request.WorkOrderId,
            CreatedByUserId = requestingUserId,
            Reference = request.Reference?.Trim(),
            Notes = request.Notes?.Trim()
        };

        part.CurrentStock = newStock;
        part.UpdatedAtUtc = DateTimeOffset.UtcNow;

        await partMovementRepository.AddAsync(movement, cancellationToken);
        await partRepository.UpdateAsync(part, cancellationToken);
        await partMovementRepository.SaveChangesAsync(cancellationToken);
        await partRepository.SaveChangesAsync(cancellationToken);

        return Result<PartMovementDto>.Success(MapMovementToDto(movement));
    }

    public async Task<Result<IReadOnlyList<PartMovementDto>>> GetWorkshopMovementsAsync(Guid workshopId, Guid requestingUserId, CancellationToken cancellationToken = default)
    {
        var membership = await workshopRepository.GetMembershipAsync(workshopId, requestingUserId, cancellationToken);
        if (membership is null || !membership.IsActive)
        {
            return Result<IReadOnlyList<PartMovementDto>>.Failure("inventory.access_denied", "You don't have access to this workshop.");
        }

        if (!CanManageParts(membership.Role))
        {
            return Result<IReadOnlyList<PartMovementDto>>.Failure("inventory.insufficient_permissions", "Only Owner and Receptionist can view movements.");
        }

        var movements = await partMovementRepository.GetByWorkshopIdAsync(workshopId, cancellationToken);
        var dtos = movements.Select(MapMovementToDto).ToList().AsReadOnly();

        return Result<IReadOnlyList<PartMovementDto>>.Success(dtos);
    }

    private static int CalculateNewStock(int currentStock, string movementType, int quantity)
    {
        return movementType switch
        {
            PartMovementType.Purchase => currentStock + quantity,
            PartMovementType.Return => currentStock + quantity,
            PartMovementType.Transfer => currentStock + quantity,
            PartMovementType.Sale => currentStock - quantity,
            PartMovementType.Damaged => currentStock - quantity,
            PartMovementType.Adjustment => quantity,
            _ => currentStock
        };
    }

    private static PartDto MapPartToDto(Part part) =>
        new(
            part.Id,
            part.WorkshopId,
            part.PartNumber,
            part.Name,
            part.Description,
            part.Brand,
            part.Category,
            part.CurrentStock,
            part.MinimumStock,
            part.MaximumStock,
            part.UnitCost,
            part.SalePrice,
            part.Location,
            part.SupplierName,
            part.SupplierContact,
            part.Notes,
            part.IsActive,
            part.CreatedAtUtc);

    private static PartMovementDto MapMovementToDto(PartMovement movement) =>
        new(
            movement.Id,
            movement.WorkshopId,
            movement.PartId,
            movement.MovementType,
            movement.Quantity,
            movement.PreviousStock,
            movement.NewStock,
            movement.UnitCost,
            movement.TotalCost,
            movement.WorkOrderId,
            movement.CreatedByUserId,
            movement.Reference,
            movement.Notes,
            movement.CreatedAtUtc);

    private static bool CanManageParts(string role) =>
        SystemRoles.IsOwner(role) || role == SystemRoles.Receptionist;
}
