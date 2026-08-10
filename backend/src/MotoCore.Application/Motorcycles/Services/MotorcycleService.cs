using MotoCore.Application.Clients.Contracts;
using MotoCore.Application.Common.Results;
using MotoCore.Application.Motorcycles.Contracts;
using MotoCore.Application.Motorcycles.Models;
using MotoCore.Application.Workshops.Contracts;
using MotoCore.Domain.Auth;
using MotoCore.Domain.Motorcycles;

namespace MotoCore.Application.Motorcycles.Services;

public sealed class MotorcycleService(
    IMotorcycleRepository motorcycleRepository,
    IWorkshopRepository workshopRepository,
    IClientRepository clientRepository) : IMotorcycleService
{
    public async Task<Result<MotorcycleDto>> CreateMotorcycleAsync(Guid workshopId, Guid requestingUserId, CreateMotorcycleRequest request, CancellationToken cancellationToken = default)
    {
        var membership = await workshopRepository.GetMembershipAsync(workshopId, requestingUserId, cancellationToken);
        if (membership is null || !membership.IsActive)
        {
            return Result<MotorcycleDto>.Failure("motorcycle.access_denied", "You don't have access to this workshop.");
        }

        if (!CanManageMotorcycles(membership.Role))
        {
            return Result<MotorcycleDto>.Failure("motorcycle.insufficient_permissions", "Only Owner and Receptionist can create motorcycles.");
        }

        var client = await clientRepository.GetByIdAsync(request.ClientId, cancellationToken);
        if (client is null || !client.IsActive)
        {
            return Result<MotorcycleDto>.Failure("motorcycle.client_not_found", "Client not found or inactive.");
        }

        if (client.WorkshopId != workshopId)
        {
            return Result<MotorcycleDto>.Failure("motorcycle.client_workshop_mismatch", "Client does not belong to this workshop.");
        }

        var normalizedLicensePlate = request.LicensePlate.Trim().ToUpperInvariant();
        var existingMotorcycle = await motorcycleRepository.GetByLicensePlateAsync(workshopId, normalizedLicensePlate, cancellationToken);
        if (existingMotorcycle is not null)
        {
            return Result<MotorcycleDto>.Failure("motorcycle.license_plate_exists", "A motorcycle with this license plate already exists in this workshop.");
        }

        var motorcycle = new Motorcycle
        {
            WorkshopId = workshopId,
            ClientId = request.ClientId,
            Brand = request.Brand.Trim(),
            Model = request.Model.Trim(),
            Year = request.Year,
            LicensePlate = normalizedLicensePlate,
            Vin = request.Vin?.Trim(),
            Color = request.Color?.Trim(),
            Mileage = request.Mileage,
            EngineSize = request.EngineSize?.Trim(),
            Notes = request.Notes?.Trim(),
            IsActive = true,
        };

        await motorcycleRepository.AddAsync(motorcycle, cancellationToken);
        await motorcycleRepository.SaveChangesAsync(cancellationToken);

        return Result<MotorcycleDto>.Success(MapToDto(motorcycle));
    }

    public async Task<Result<MotorcycleDto>> GetMotorcycleByIdAsync(Guid workshopId, Guid motorcycleId, Guid requestingUserId, CancellationToken cancellationToken = default)
    {
        var membership = await workshopRepository.GetMembershipAsync(workshopId, requestingUserId, cancellationToken);
        if (membership is null || !membership.IsActive)
        {
            return Result<MotorcycleDto>.Failure("motorcycle.access_denied", "You don't have access to this workshop.");
        }

        var motorcycle = await motorcycleRepository.GetByIdAsync(motorcycleId, cancellationToken);
        if (motorcycle is null)
        {
            return Result<MotorcycleDto>.Failure("motorcycle.not_found", "Motorcycle not found.");
        }

        if (motorcycle.WorkshopId != workshopId)
        {
            return Result<MotorcycleDto>.Failure("motorcycle.workshop_mismatch", "This motorcycle does not belong to the specified workshop.");
        }

        return Result<MotorcycleDto>.Success(MapToDto(motorcycle));
    }

    public async Task<Result<IReadOnlyList<MotorcycleDto>>> GetWorkshopMotorcyclesAsync(Guid workshopId, Guid requestingUserId, CancellationToken cancellationToken = default)
    {
        var membership = await workshopRepository.GetMembershipAsync(workshopId, requestingUserId, cancellationToken);
        if (membership is null || !membership.IsActive)
        {
            return Result<IReadOnlyList<MotorcycleDto>>.Failure("motorcycle.access_denied", "You don't have access to this workshop.");
        }

        var motorcycles = await motorcycleRepository.GetByWorkshopIdAsync(workshopId, cancellationToken);
        var dtos = motorcycles.Select(MapToDto).ToList().AsReadOnly();

        return Result<IReadOnlyList<MotorcycleDto>>.Success(dtos);
    }

    public async Task<Result<IReadOnlyList<MotorcycleDto>>> GetClientMotorcyclesAsync(Guid workshopId, Guid clientId, Guid requestingUserId, CancellationToken cancellationToken = default)
    {
        var membership = await workshopRepository.GetMembershipAsync(workshopId, requestingUserId, cancellationToken);
        if (membership is null || !membership.IsActive)
        {
            return Result<IReadOnlyList<MotorcycleDto>>.Failure("motorcycle.access_denied", "You don't have access to this workshop.");
        }

        var client = await clientRepository.GetByIdAsync(clientId, cancellationToken);
        if (client is null || !client.IsActive)
        {
            return Result<IReadOnlyList<MotorcycleDto>>.Failure("motorcycle.client_not_found", "Client not found or inactive.");
        }

        if (client.WorkshopId != workshopId)
        {
            return Result<IReadOnlyList<MotorcycleDto>>.Failure("motorcycle.client_workshop_mismatch", "This client does not belong to the specified workshop.");
        }

        var motorcycles = await motorcycleRepository.GetByClientIdAsync(clientId, cancellationToken);
        var dtos = motorcycles.Select(MapToDto).ToList().AsReadOnly();

        return Result<IReadOnlyList<MotorcycleDto>>.Success(dtos);
    }

    public async Task<Result<MotorcycleDto>> UpdateMotorcycleAsync(Guid workshopId, Guid motorcycleId, Guid requestingUserId, UpdateMotorcycleRequest request, CancellationToken cancellationToken = default)
    {
        var membership = await workshopRepository.GetMembershipAsync(workshopId, requestingUserId, cancellationToken);
        if (membership is null || !membership.IsActive)
        {
            return Result<MotorcycleDto>.Failure("motorcycle.access_denied", "You don't have access to this workshop.");
        }

        if (!CanManageMotorcycles(membership.Role))
        {
            return Result<MotorcycleDto>.Failure("motorcycle.insufficient_permissions", "Only Owner and Receptionist can update motorcycles.");
        }

        var motorcycle = await motorcycleRepository.GetByIdAsync(motorcycleId, cancellationToken);
        if (motorcycle is null)
        {
            return Result<MotorcycleDto>.Failure("motorcycle.not_found", "Motorcycle not found.");
        }

        if (motorcycle.WorkshopId != workshopId)
        {
            return Result<MotorcycleDto>.Failure("motorcycle.workshop_mismatch", "This motorcycle does not belong to the specified workshop.");
        }

        var normalizedLicensePlate = request.LicensePlate.Trim().ToUpperInvariant();
        if (normalizedLicensePlate != motorcycle.LicensePlate)
        {
            var existingMotorcycle = await motorcycleRepository.GetByLicensePlateAsync(motorcycle.WorkshopId, normalizedLicensePlate, cancellationToken);
            if (existingMotorcycle is not null)
            {
                return Result<MotorcycleDto>.Failure("motorcycle.license_plate_exists", "A motorcycle with this license plate already exists in this workshop.");
            }
        }

        motorcycle.Brand = request.Brand.Trim();
        motorcycle.Model = request.Model.Trim();
        motorcycle.Year = request.Year;
        motorcycle.LicensePlate = normalizedLicensePlate;
        motorcycle.Vin = request.Vin?.Trim();
        motorcycle.Color = request.Color?.Trim();
        motorcycle.Mileage = request.Mileage;
        motorcycle.EngineSize = request.EngineSize?.Trim();
        motorcycle.Notes = request.Notes?.Trim();
        motorcycle.UpdatedAtUtc = DateTimeOffset.UtcNow;

        await motorcycleRepository.UpdateAsync(motorcycle, cancellationToken);
        await motorcycleRepository.SaveChangesAsync(cancellationToken);

        return Result<MotorcycleDto>.Success(MapToDto(motorcycle));
    }

    public async Task<Result> DeleteMotorcycleAsync(Guid workshopId, Guid motorcycleId, Guid requestingUserId, CancellationToken cancellationToken = default)
    {
        var membership = await workshopRepository.GetMembershipAsync(workshopId, requestingUserId, cancellationToken);
        if (membership is null || !membership.IsActive)
        {
            return Result.Failure("motorcycle.access_denied", "You don't have access to this workshop.");
        }

        if (membership.Role != SystemRoles.Owner)
        {
            return Result.Failure("motorcycle.insufficient_permissions", "Only Owner can delete motorcycles.");
        }

        var motorcycle = await motorcycleRepository.GetByIdAsync(motorcycleId, cancellationToken);
        if (motorcycle is null)
        {
            return Result.Failure("motorcycle.not_found", "Motorcycle not found.");
        }

        if (motorcycle.WorkshopId != workshopId)
        {
            return Result.Failure("motorcycle.workshop_mismatch", "This motorcycle does not belong to the specified workshop.");
        }

        motorcycle.IsActive = false;
        motorcycle.UpdatedAtUtc = DateTimeOffset.UtcNow;

        await motorcycleRepository.UpdateAsync(motorcycle, cancellationToken);
        await motorcycleRepository.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }

    private static bool CanManageMotorcycles(string role)
    {
        return role is SystemRoles.Owner or SystemRoles.Receptionist;
    }

    private static MotorcycleDto MapToDto(Motorcycle motorcycle)
    {
        return new MotorcycleDto(
            motorcycle.Id,
            motorcycle.WorkshopId,
            motorcycle.ClientId,
            motorcycle.Brand,
            motorcycle.Model,
            motorcycle.Year,
            motorcycle.LicensePlate,
            motorcycle.Vin,
            motorcycle.Color,
            motorcycle.Mileage,
            motorcycle.EngineSize,
            motorcycle.Notes,
            motorcycle.IsActive,
            motorcycle.CreatedAtUtc);
    }
}
