namespace MotoCore.Application.Motorcycles.Models;

public sealed record UpdateMotorcycleRequest(
    string Brand,
    string Model,
    int Year,
    string LicensePlate,
    string? Vin,
    string? Color,
    int? Mileage,
    string? EngineSize,
    string? Notes);
