using MotoCore.Domain.Motorcycles;

namespace MotoCore.Application.Motorcycles.Contracts;

public interface IMotorcycleRepository
{
    Task<Motorcycle?> GetByIdAsync(Guid motorcycleId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Motorcycle>> GetByWorkshopIdAsync(Guid workshopId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Motorcycle>> GetByClientIdAsync(Guid clientId, CancellationToken cancellationToken = default);
    Task<Motorcycle?> GetByLicensePlateAsync(Guid workshopId, string licensePlate, CancellationToken cancellationToken = default);
    Task AddAsync(Motorcycle motorcycle, CancellationToken cancellationToken = default);
    Task UpdateAsync(Motorcycle motorcycle, CancellationToken cancellationToken = default);
    Task DeleteAsync(Motorcycle motorcycle, CancellationToken cancellationToken = default);
    Task<int> CountActiveMotorcyclesAsync(Guid workshopId, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
