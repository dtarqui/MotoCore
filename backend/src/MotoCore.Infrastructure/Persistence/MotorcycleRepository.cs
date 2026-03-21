using Microsoft.EntityFrameworkCore;
using MotoCore.Application.Motorcycles.Contracts;
using MotoCore.Domain.Motorcycles;

namespace MotoCore.Infrastructure.Persistence;

public sealed class MotorcycleRepository(MotoCoreDbContext context) : IMotorcycleRepository
{
    public async Task<Motorcycle?> GetByIdAsync(Guid motorcycleId, CancellationToken cancellationToken = default)
    {
        return await context.Motorcycles
            .FirstOrDefaultAsync(m => m.Id == motorcycleId, cancellationToken);
    }

    public async Task<IReadOnlyList<Motorcycle>> GetByWorkshopIdAsync(Guid workshopId, CancellationToken cancellationToken = default)
    {
        return await context.Motorcycles
            .Where(m => m.WorkshopId == workshopId && m.IsActive)
            .OrderBy(m => m.Brand)
            .ThenBy(m => m.Model)
            .ThenBy(m => m.Year)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Motorcycle>> GetByClientIdAsync(Guid clientId, CancellationToken cancellationToken = default)
    {
        return await context.Motorcycles
            .Where(m => m.ClientId == clientId && m.IsActive)
            .OrderBy(m => m.Brand)
            .ThenBy(m => m.Model)
            .ThenBy(m => m.Year)
            .ToListAsync(cancellationToken);
    }

    public async Task<Motorcycle?> GetByLicensePlateAsync(Guid workshopId, string licensePlate, CancellationToken cancellationToken = default)
    {
        return await context.Motorcycles
            .FirstOrDefaultAsync(m => m.WorkshopId == workshopId && m.LicensePlate == licensePlate, cancellationToken);
    }

    public async Task AddAsync(Motorcycle motorcycle, CancellationToken cancellationToken = default)
    {
        await context.Motorcycles.AddAsync(motorcycle, cancellationToken);
    }

    public Task UpdateAsync(Motorcycle motorcycle, CancellationToken cancellationToken = default)
    {
        context.Motorcycles.Update(motorcycle);
        return Task.CompletedTask;
    }

    public Task DeleteAsync(Motorcycle motorcycle, CancellationToken cancellationToken = default)
    {
        context.Motorcycles.Remove(motorcycle);
        return Task.CompletedTask;
    }

    public async Task<int> CountActiveMotorcyclesAsync(Guid workshopId, CancellationToken cancellationToken = default)
    {
        return await context.Motorcycles
            .CountAsync(m => m.WorkshopId == workshopId && m.IsActive, cancellationToken);
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        await context.SaveChangesAsync(cancellationToken);
    }
}
