using MotoCore.Domain.Clients;

namespace MotoCore.Application.Clients.Contracts;

public interface IClientRepository
{
    Task<Client?> GetByIdAsync(Guid clientId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Client>> GetByWorkshopIdAsync(Guid workshopId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Client>> SearchAsync(Guid workshopId, string searchTerm, CancellationToken cancellationToken = default);
    Task<Client?> GetByEmailAsync(Guid workshopId, string email, CancellationToken cancellationToken = default);
    Task AddAsync(Client client, CancellationToken cancellationToken = default);
    Task UpdateAsync(Client client, CancellationToken cancellationToken = default);
    Task DeleteAsync(Client client, CancellationToken cancellationToken = default);
    Task<int> CountActiveClientsAsync(Guid workshopId, CancellationToken cancellationToken = default);
    Task<int> CountNewClientsThisMonthAsync(Guid workshopId, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
