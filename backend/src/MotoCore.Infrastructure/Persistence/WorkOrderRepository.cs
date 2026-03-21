using Microsoft.EntityFrameworkCore;
using MotoCore.Application.WorkOrders.Contracts;
using MotoCore.Domain.WorkOrders;

namespace MotoCore.Infrastructure.Persistence;

public sealed class WorkOrderRepository(MotoCoreDbContext context) : IWorkOrderRepository
{
    public async Task<WorkOrder?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await context.WorkOrders
            .FirstOrDefaultAsync(wo => wo.Id == id, cancellationToken);
    }

    public async Task<WorkOrder?> GetByOrderNumberAsync(Guid workshopId, string orderNumber, CancellationToken cancellationToken = default)
    {
        return await context.WorkOrders
            .FirstOrDefaultAsync(wo => wo.WorkshopId == workshopId && wo.OrderNumber == orderNumber, cancellationToken);
    }

    public async Task<IReadOnlyList<WorkOrder>> GetByWorkshopIdAsync(Guid workshopId, CancellationToken cancellationToken = default)
    {
        return await context.WorkOrders
            .Where(wo => wo.WorkshopId == workshopId && wo.IsActive)
            .OrderByDescending(wo => wo.CreatedAtUtc)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<WorkOrder>> GetByMotorcycleIdAsync(Guid motorcycleId, CancellationToken cancellationToken = default)
    {
        return await context.WorkOrders
            .Where(wo => wo.MotorcycleId == motorcycleId && wo.IsActive)
            .OrderByDescending(wo => wo.CreatedAtUtc)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<WorkOrder>> GetByStatusAsync(Guid workshopId, string status, CancellationToken cancellationToken = default)
    {
        return await context.WorkOrders
            .Where(wo => wo.WorkshopId == workshopId && wo.Status == status && wo.IsActive)
            .OrderByDescending(wo => wo.CreatedAtUtc)
            .ToListAsync(cancellationToken);
    }

    public async Task AddAsync(WorkOrder workOrder, CancellationToken cancellationToken = default)
    {
        await context.WorkOrders.AddAsync(workOrder, cancellationToken);
    }

    public Task UpdateAsync(WorkOrder workOrder, CancellationToken cancellationToken = default)
    {
        context.WorkOrders.Update(workOrder);
        return Task.CompletedTask;
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        await context.SaveChangesAsync(cancellationToken);
    }
}
