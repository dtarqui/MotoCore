using MotoCore.Application.Clients.Contracts;
using MotoCore.Application.Clients.Models;
using MotoCore.Application.Common.Results;
using MotoCore.Application.Workshops.Contracts;
using MotoCore.Domain.Auth;
using MotoCore.Domain.Clients;

namespace MotoCore.Application.Clients.Services;

public sealed class ClientService(
    IClientRepository clientRepository,
    IWorkshopRepository workshopRepository) : IClientService
{
    public async Task<Result<ClientDto>> CreateClientAsync(Guid workshopId, Guid requestingUserId, CreateClientRequest request, CancellationToken cancellationToken = default)
    {
        var membership = await workshopRepository.GetMembershipAsync(workshopId, requestingUserId, cancellationToken);
        if (membership is null || !membership.IsActive)
        {
            return Result<ClientDto>.Failure("client.access_denied", "You don't have access to this workshop.");
        }

        if (!CanManageClients(membership.Role))
        {
            return Result<ClientDto>.Failure("client.insufficient_permissions", "Only Owner and Receptionist can create clients.");
        }

        var normalizedEmail = request.Email.Trim().ToUpperInvariant();
        var existingClient = await clientRepository.GetByEmailAsync(workshopId, normalizedEmail, cancellationToken);
        if (existingClient is not null)
        {
            return Result<ClientDto>.Failure("client.email_already_exists", "A client with this email already exists in this workshop.");
        }

        var client = new Client
        {
            WorkshopId = workshopId,
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            Email = normalizedEmail,
            Phone = request.Phone.Trim(),
            SecondaryPhone = request.SecondaryPhone?.Trim(),
            Address = request.Address?.Trim(),
            City = request.City?.Trim(),
            PostalCode = request.PostalCode?.Trim(),
            IdentificationNumber = request.IdentificationNumber?.Trim(),
            CompanyName = request.CompanyName?.Trim(),
            TaxId = request.TaxId?.Trim(),
            BirthDate = request.BirthDate,
            PreferredContactMethod = request.PreferredContactMethod?.Trim(),
            Notes = request.Notes?.Trim(),
            IsActive = true,
        };

        await clientRepository.AddAsync(client, cancellationToken);
        await clientRepository.SaveChangesAsync(cancellationToken);

        return Result<ClientDto>.Success(MapToDto(client));
    }

    public async Task<Result<ClientDto>> GetClientByIdAsync(Guid workshopId, Guid clientId, Guid requestingUserId, CancellationToken cancellationToken = default)
    {
        var membership = await workshopRepository.GetMembershipAsync(workshopId, requestingUserId, cancellationToken);
        if (membership is null || !membership.IsActive)
        {
            return Result<ClientDto>.Failure("client.access_denied", "You don't have access to this workshop.");
        }

        var client = await clientRepository.GetByIdAsync(clientId, cancellationToken);
        if (client is null || client.WorkshopId != workshopId)
        {
            return Result<ClientDto>.Failure("client.not_found", "Client not found.");
        }

        return Result<ClientDto>.Success(MapToDto(client));
    }

    public async Task<Result<IReadOnlyList<ClientDto>>> GetWorkshopClientsAsync(Guid workshopId, Guid requestingUserId, CancellationToken cancellationToken = default)
    {
        var membership = await workshopRepository.GetMembershipAsync(workshopId, requestingUserId, cancellationToken);
        if (membership is null || !membership.IsActive)
        {
            return Result<IReadOnlyList<ClientDto>>.Failure("client.access_denied", "You don't have access to this workshop.");
        }

        var clients = await clientRepository.GetByWorkshopIdAsync(workshopId, cancellationToken);
        var dtos = clients.Select(MapToDto).ToList().AsReadOnly();

        return Result<IReadOnlyList<ClientDto>>.Success(dtos);
    }

    public async Task<Result<IReadOnlyList<ClientDto>>> SearchClientsAsync(Guid workshopId, string searchTerm, Guid requestingUserId, CancellationToken cancellationToken = default)
    {
        var membership = await workshopRepository.GetMembershipAsync(workshopId, requestingUserId, cancellationToken);
        if (membership is null || !membership.IsActive)
        {
            return Result<IReadOnlyList<ClientDto>>.Failure("client.access_denied", "You don't have access to this workshop.");
        }

        if (string.IsNullOrWhiteSpace(searchTerm))
        {
            return Result<IReadOnlyList<ClientDto>>.Failure("client.invalid_search_term", "Search term is required.");
        }

        var clients = await clientRepository.SearchAsync(workshopId, searchTerm.Trim(), cancellationToken);
        var dtos = clients.Select(MapToDto).ToList().AsReadOnly();

        return Result<IReadOnlyList<ClientDto>>.Success(dtos);
    }

    public async Task<Result<ClientDto>> UpdateClientAsync(Guid workshopId, Guid clientId, Guid requestingUserId, UpdateClientRequest request, CancellationToken cancellationToken = default)
    {
        var membership = await workshopRepository.GetMembershipAsync(workshopId, requestingUserId, cancellationToken);
        if (membership is null || !membership.IsActive)
        {
            return Result<ClientDto>.Failure("client.access_denied", "You don't have access to this workshop.");
        }

        if (!CanManageClients(membership.Role))
        {
            return Result<ClientDto>.Failure("client.insufficient_permissions", "Only Owner and Receptionist can update clients.");
        }

        var client = await clientRepository.GetByIdAsync(clientId, cancellationToken);
        if (client is null || client.WorkshopId != workshopId)
        {
            return Result<ClientDto>.Failure("client.not_found", "Client not found.");
        }

        var normalizedEmail = request.Email.Trim().ToUpperInvariant();
        if (normalizedEmail != client.Email)
        {
            var existingClient = await clientRepository.GetByEmailAsync(client.WorkshopId, normalizedEmail, cancellationToken);
            if (existingClient is not null)
            {
                return Result<ClientDto>.Failure("client.email_already_exists", "A client with this email already exists in this workshop.");
            }
        }

        client.FirstName = request.FirstName.Trim();
        client.LastName = request.LastName.Trim();
        client.Email = normalizedEmail;
        client.Phone = request.Phone.Trim();
        client.SecondaryPhone = request.SecondaryPhone?.Trim();
        client.Address = request.Address?.Trim();
        client.City = request.City?.Trim();
        client.PostalCode = request.PostalCode?.Trim();
        client.IdentificationNumber = request.IdentificationNumber?.Trim();
        client.CompanyName = request.CompanyName?.Trim();
        client.TaxId = request.TaxId?.Trim();
        client.BirthDate = request.BirthDate;
        client.PreferredContactMethod = request.PreferredContactMethod?.Trim();
        client.Notes = request.Notes?.Trim();
        client.UpdatedAtUtc = DateTimeOffset.UtcNow;

        await clientRepository.UpdateAsync(client, cancellationToken);
        await clientRepository.SaveChangesAsync(cancellationToken);

        return Result<ClientDto>.Success(MapToDto(client));
    }

    public async Task<Result> DeleteClientAsync(Guid workshopId, Guid clientId, Guid requestingUserId, CancellationToken cancellationToken = default)
    {
        var membership = await workshopRepository.GetMembershipAsync(workshopId, requestingUserId, cancellationToken);
        if (membership is null || !membership.IsActive)
        {
            return Result.Failure("client.access_denied", "You don't have access to this workshop.");
        }

        if (!CanManageClients(membership.Role))
        {
            return Result.Failure("client.insufficient_permissions", "Only Owner and Receptionist can delete clients.");
        }

        var client = await clientRepository.GetByIdAsync(clientId, cancellationToken);
        if (client is null || client.WorkshopId != workshopId)
        {
            return Result.Failure("client.not_found", "Client not found.");
        }

        client.IsActive = false;
        client.UpdatedAtUtc = DateTimeOffset.UtcNow;

        await clientRepository.UpdateAsync(client, cancellationToken);
        await clientRepository.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }

    public async Task<Result<ClientSummaryDto>> GetClientSummaryAsync(Guid workshopId, Guid clientId, Guid requestingUserId, CancellationToken cancellationToken = default)
    {
        var membership = await workshopRepository.GetMembershipAsync(workshopId, requestingUserId, cancellationToken);
        if (membership is null || !membership.IsActive)
        {
            return Result<ClientSummaryDto>.Failure("client.access_denied", "You don't have access to this workshop.");
        }

        var client = await clientRepository.GetByIdAsync(clientId, cancellationToken);
        if (client is null || client.WorkshopId != workshopId)
        {
            return Result<ClientSummaryDto>.Failure("client.not_found", "Client not found.");
        }

        var summary = new ClientSummaryDto(
            client.Id,
            $"{client.FirstName} {client.LastName}",
            client.Email,
            client.Phone,
            TotalVehicles: 0,
            TotalWorkOrders: 0,
            LastServiceDate: null,
            TotalSpent: 0m);

        return Result<ClientSummaryDto>.Success(summary);
    }

    public async Task<Result<ClientStatisticsDto>> GetClientStatisticsAsync(Guid workshopId, Guid requestingUserId, CancellationToken cancellationToken = default)
    {
        var membership = await workshopRepository.GetMembershipAsync(workshopId, requestingUserId, cancellationToken);
        if (membership is null || !membership.IsActive)
        {
            return Result<ClientStatisticsDto>.Failure("client.access_denied", "You don't have access to this workshop.");
        }

        var clients = await clientRepository.GetByWorkshopIdAsync(workshopId, cancellationToken);
        var activeClients = await clientRepository.CountActiveClientsAsync(workshopId, cancellationToken);
        var newClientsThisMonth = await clientRepository.CountNewClientsThisMonthAsync(workshopId, cancellationToken);

        var statistics = new ClientStatisticsDto(
            TotalClients: clients.Count,
            ActiveClients: activeClients,
            InactiveClients: clients.Count - activeClients,
            NewClientsThisMonth: newClientsThisMonth,
            ClientsWithPendingOrders: 0);

        return Result<ClientStatisticsDto>.Success(statistics);
    }

    private static ClientDto MapToDto(Client client) =>
        new(
            client.Id,
            client.WorkshopId,
            client.FirstName,
            client.LastName,
            client.Email,
            client.Phone,
            client.SecondaryPhone,
            client.Address,
            client.City,
            client.PostalCode,
            client.IdentificationNumber,
            client.CompanyName,
            client.TaxId,
            client.BirthDate,
            client.PreferredContactMethod,
            client.Notes,
            client.IsActive,
            client.CreatedAtUtc);

    private static bool CanManageClients(string role) =>
        SystemRoles.IsOwner(role) || role == SystemRoles.Receptionist;
}
