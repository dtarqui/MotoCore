using Microsoft.EntityFrameworkCore;
using MotoCore.Application.Inventory.Contracts;
using MotoCore.Domain.Inventory;

namespace MotoCore.Infrastructure.Persistence;

public sealed class PartRepository(MotoCoreDbContext context) : IPartRepository
{
    public async Task<Part?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await context.Parts
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
    }

    public async Task<Part?> GetByPartNumberAsync(Guid workshopId, string partNumber, CancellationToken cancellationToken = default)
    {
        return await context.Parts
            .FirstOrDefaultAsync(p => p.WorkshopId == workshopId && p.PartNumber == partNumber, cancellationToken);
    }

    public async Task<IReadOnlyList<Part>> GetByWorkshopIdAsync(Guid workshopId, CancellationToken cancellationToken = default)
    {
        return await context.Parts
            .Where(p => p.WorkshopId == workshopId && p.IsActive)
            .OrderBy(p => p.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Part>> GetLowStockPartsAsync(Guid workshopId, CancellationToken cancellationToken = default)
    {
        return await context.Parts
            .Where(p => p.WorkshopId == workshopId && p.IsActive && p.CurrentStock <= p.MinimumStock)
            .OrderBy(p => p.CurrentStock)
            .ThenBy(p => p.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task AddAsync(Part part, CancellationToken cancellationToken = default)
    {
        await context.Parts.AddAsync(part, cancellationToken);
    }

    public Task UpdateAsync(Part part, CancellationToken cancellationToken = default)
    {
        context.Parts.Update(part);
        return Task.CompletedTask;
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        await context.SaveChangesAsync(cancellationToken);
    }
}
