namespace MotoCore.Application.Motorcycles.Models;

public sealed record MotorcycleDto(
    Guid Id,
    Guid WorkshopId,
    Guid ClientId,
    string Brand,
    string Model,
    int Year,
    string LicensePlate,
    string? Vin,
    string? Color,
    int? Mileage,
    string? EngineSize,
    string? Notes,
    bool IsActive,
    DateTimeOffset CreatedAtUtc);
