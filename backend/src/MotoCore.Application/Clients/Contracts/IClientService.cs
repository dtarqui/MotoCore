using MotoCore.Application.Clients.Models;
using MotoCore.Application.Common.Results;

namespace MotoCore.Application.Clients.Contracts;

public interface IClientService
{
    Task<Result<ClientDto>> CreateClientAsync(Guid workshopId, Guid requestingUserId, CreateClientRequest request, CancellationToken cancellationToken = default);
    Task<Result<ClientDto>> GetClientByIdAsync(Guid clientId, Guid requestingUserId, CancellationToken cancellationToken = default);
    Task<Result<IReadOnlyList<ClientDto>>> GetWorkshopClientsAsync(Guid workshopId, Guid requestingUserId, CancellationToken cancellationToken = default);
    Task<Result<IReadOnlyList<ClientDto>>> SearchClientsAsync(Guid workshopId, string searchTerm, Guid requestingUserId, CancellationToken cancellationToken = default);
    Task<Result<ClientDto>> UpdateClientAsync(Guid clientId, Guid requestingUserId, UpdateClientRequest request, CancellationToken cancellationToken = default);
    Task<Result> DeleteClientAsync(Guid clientId, Guid requestingUserId, CancellationToken cancellationToken = default);
    Task<Result<ClientSummaryDto>> GetClientSummaryAsync(Guid clientId, Guid requestingUserId, CancellationToken cancellationToken = default);
    Task<Result<ClientStatisticsDto>> GetClientStatisticsAsync(Guid workshopId, Guid requestingUserId, CancellationToken cancellationToken = default);
}
