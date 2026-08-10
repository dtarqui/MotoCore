using Microsoft.EntityFrameworkCore;
using MotoCore.Application.Clients.Contracts;
using MotoCore.Domain.Clients;

namespace MotoCore.Infrastructure.Persistence;

public sealed class ClientRepository(MotoCoreDbContext context) : IClientRepository
{
    public async Task<Client?> GetByIdAsync(Guid clientId, CancellationToken cancellationToken = default)
    {
        return await context.Clients
            .FirstOrDefaultAsync(c => c.Id == clientId, cancellationToken);
    }

    public async Task<IReadOnlyList<Client>> GetByWorkshopIdAsync(Guid workshopId, CancellationToken cancellationToken = default)
    {
        return await context.Clients
            .Where(c => c.WorkshopId == workshopId && c.IsActive)
            .OrderBy(c => c.LastName)
            .ThenBy(c => c.FirstName)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Client>> SearchAsync(Guid workshopId, string searchTerm, CancellationToken cancellationToken = default)
    {
        var normalizedSearchTerm = searchTerm.ToUpperInvariant();

        return await context.Clients
            .Where(c => c.WorkshopId == workshopId && c.IsActive &&
                (c.FirstName.ToUpper().Contains(normalizedSearchTerm) ||
                 c.LastName.ToUpper().Contains(normalizedSearchTerm) ||
                 c.Email.ToUpper().Contains(normalizedSearchTerm) ||
                 c.Phone.Contains(searchTerm) ||
                 (c.IdentificationNumber != null && c.IdentificationNumber.Contains(searchTerm)) ||
                 (c.CompanyName != null && c.CompanyName.ToUpper().Contains(normalizedSearchTerm))))
            .OrderBy(c => c.LastName)
            .ThenBy(c => c.FirstName)
            .ToListAsync(cancellationToken);
    }

    public async Task<Client?> GetByEmailAsync(Guid workshopId, string email, CancellationToken cancellationToken = default)
    {
        return await context.Clients
            .FirstOrDefaultAsync(c => c.WorkshopId == workshopId && c.Email == email, cancellationToken);
    }

    public async Task AddAsync(Client client, CancellationToken cancellationToken = default)
    {
        await context.Clients.AddAsync(client, cancellationToken);
    }

    public Task UpdateAsync(Client client, CancellationToken cancellationToken = default)
    {
        context.Clients.Update(client);
        return Task.CompletedTask;
    }

    public Task DeleteAsync(Client client, CancellationToken cancellationToken = default)
    {
        context.Clients.Remove(client);
        return Task.CompletedTask;
    }

    public async Task<int> CountActiveClientsAsync(Guid workshopId, CancellationToken cancellationToken = default)
    {
        return await context.Clients
            .CountAsync(c => c.WorkshopId == workshopId && c.IsActive, cancellationToken);
    }

    public async Task<int> CountNewClientsThisMonthAsync(Guid workshopId, CancellationToken cancellationToken = default)
    {
        var startOfMonth = new DateTimeOffset(DateTimeOffset.UtcNow.Year, DateTimeOffset.UtcNow.Month, 1, 0, 0, 0, TimeSpan.Zero);

        return await context.Clients
            .CountAsync(c => c.WorkshopId == workshopId && c.CreatedAtUtc >= startOfMonth, cancellationToken);
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        await context.SaveChangesAsync(cancellationToken);
    }
}
