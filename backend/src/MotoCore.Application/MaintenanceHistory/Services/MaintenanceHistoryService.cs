using MotoCore.Application.Clients.Contracts;
using MotoCore.Application.Common.Results;
using MotoCore.Application.MaintenanceHistory.Contracts;
using MotoCore.Application.MaintenanceHistory.Models;
using MotoCore.Application.Motorcycles.Contracts;
using MotoCore.Application.Workshops.Contracts;
using MotoCore.Domain.MaintenanceHistory;

namespace MotoCore.Application.MaintenanceHistory.Services;

public sealed class MaintenanceHistoryService(
    IMaintenanceHistoryRepository maintenanceHistoryRepository,
    IMotorcycleRepository motorcycleRepository,
    IClientRepository clientRepository,
    IWorkshopRepository workshopRepository) : IMaintenanceHistoryService
{
    public async Task<Result<MaintenanceHistoryEntryDto>> CreateMaintenanceHistoryEntryAsync(Guid workshopId, Guid requestingUserId, CreateMaintenanceHistoryEntryRequest request, CancellationToken cancellationToken = default)
    {
        var membership = await workshopRepository.GetMembershipAsync(workshopId, requestingUserId, cancellationToken);
        if (membership is null || !membership.IsActive)
        {
            return Result<MaintenanceHistoryEntryDto>.Failure("maintenance_history.access_denied", "You don't have access to this workshop.");
        }

        var motorcycle = await motorcycleRepository.GetByIdAsync(request.MotorcycleId, cancellationToken);
        if (motorcycle is null || !motorcycle.IsActive)
        {
            return Result<MaintenanceHistoryEntryDto>.Failure("maintenance_history.motorcycle_not_found", "Motorcycle not found or inactive.");
        }

        if (motorcycle.WorkshopId != workshopId)
        {
            return Result<MaintenanceHistoryEntryDto>.Failure("maintenance_history.motorcycle_workshop_mismatch", "Motorcycle does not belong to this workshop.");
        }

        var client = await clientRepository.GetByIdAsync(motorcycle.ClientId, cancellationToken);
        if (client is null)
        {
            return Result<MaintenanceHistoryEntryDto>.Failure("maintenance_history.client_not_found", "Client not found.");
        }

        var entry = new MaintenanceHistoryEntry
        {
            WorkshopId = workshopId,
            MotorcycleId = request.MotorcycleId,
            ClientId = motorcycle.ClientId,
            Title = request.Title.Trim(),
            Description = request.Description.Trim(),
            MileageAtService = request.MileageAtService,
            TotalCost = request.TotalCost,
            ServiceDate = request.ServiceDate,
            PerformedByUserId = requestingUserId,
            ServicesPerformed = request.ServicesPerformed?.Trim(),
            PartsUsed = request.PartsUsed?.Trim(),
            Recommendations = request.Recommendations?.Trim(),
            Notes = request.Notes?.Trim()
        };

        await maintenanceHistoryRepository.AddAsync(entry, cancellationToken);
        await maintenanceHistoryRepository.SaveChangesAsync(cancellationToken);

        return Result<MaintenanceHistoryEntryDto>.Success(MapToDto(entry));
    }

    public async Task<Result<MaintenanceHistoryEntryDto>> GetMaintenanceHistoryEntryByIdAsync(Guid workshopId, Guid entryId, Guid requestingUserId, CancellationToken cancellationToken = default)
    {
        var membership = await workshopRepository.GetMembershipAsync(workshopId, requestingUserId, cancellationToken);
        if (membership is null || !membership.IsActive)
        {
            return Result<MaintenanceHistoryEntryDto>.Failure("maintenance_history.access_denied", "You don't have access to this workshop.");
        }

        var entry = await maintenanceHistoryRepository.GetByIdAsync(entryId, cancellationToken);
        if (entry is null || entry.WorkshopId != workshopId)
        {
            return Result<MaintenanceHistoryEntryDto>.Failure("maintenance_history.entry_not_found", "Maintenance history entry not found.");
        }

        return Result<MaintenanceHistoryEntryDto>.Success(MapToDto(entry));
    }

    public async Task<Result<IReadOnlyList<MaintenanceHistoryEntryDto>>> GetMotorcycleMaintenanceHistoryAsync(Guid workshopId, Guid motorcycleId, Guid requestingUserId, CancellationToken cancellationToken = default)
    {
        var membership = await workshopRepository.GetMembershipAsync(workshopId, requestingUserId, cancellationToken);
        if (membership is null || !membership.IsActive)
        {
            return Result<IReadOnlyList<MaintenanceHistoryEntryDto>>.Failure("maintenance_history.access_denied", "You don't have access to this workshop.");
        }

        var motorcycle = await motorcycleRepository.GetByIdAsync(motorcycleId, cancellationToken);
        if (motorcycle is null || motorcycle.WorkshopId != workshopId)
        {
            return Result<IReadOnlyList<MaintenanceHistoryEntryDto>>.Failure("maintenance_history.motorcycle_not_found", "Motorcycle not found in this workshop.");
        }

        var entries = await maintenanceHistoryRepository.GetByMotorcycleIdAsync(motorcycleId, cancellationToken);
        var dtos = entries.Select(MapToDto).ToList().AsReadOnly();

        return Result<IReadOnlyList<MaintenanceHistoryEntryDto>>.Success(dtos);
    }

    public async Task<Result<IReadOnlyList<MaintenanceHistoryEntryDto>>> GetClientMaintenanceHistoryAsync(Guid workshopId, Guid clientId, Guid requestingUserId, CancellationToken cancellationToken = default)
    {
        var membership = await workshopRepository.GetMembershipAsync(workshopId, requestingUserId, cancellationToken);
        if (membership is null || !membership.IsActive)
        {
            return Result<IReadOnlyList<MaintenanceHistoryEntryDto>>.Failure("maintenance_history.access_denied", "You don't have access to this workshop.");
        }

        var client = await clientRepository.GetByIdAsync(clientId, cancellationToken);
        if (client is null || client.WorkshopId != workshopId)
        {
            return Result<IReadOnlyList<MaintenanceHistoryEntryDto>>.Failure("maintenance_history.client_not_found", "Client not found in this workshop.");
        }

        var entries = await maintenanceHistoryRepository.GetByClientIdAsync(clientId, cancellationToken);
        var dtos = entries.Select(MapToDto).ToList().AsReadOnly();

        return Result<IReadOnlyList<MaintenanceHistoryEntryDto>>.Success(dtos);
    }

    // TODO: Implementar cuando se defina el sistema de almacenamiento (S3 u otro)
    // public async Task<Result> UploadMaintenancePhotoAsync(...)
    // {
    //     // Implementación futura con S3 o servicio similar
    // }

    private static MaintenanceHistoryEntryDto MapToDto(MaintenanceHistoryEntry entry) =>
        new(
            entry.Id,
            entry.WorkshopId,
            entry.MotorcycleId,
            entry.ClientId,
            entry.WorkOrderId,
            entry.Title,
            entry.Description,
            entry.MileageAtService,
            entry.TotalCost,
            entry.ServiceDate,
            entry.PerformedByUserId,
            entry.ServicesPerformed,
            entry.PartsUsed,
            entry.Recommendations,
            entry.Notes,
            entry.CreatedAtUtc);
}
