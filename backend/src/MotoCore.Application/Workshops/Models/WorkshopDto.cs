namespace MotoCore.Application.Workshops.Models;

public sealed record WorkshopDto(
    Guid Id,
    string Name,
    string? Description,
    string? Address,
    string? PhoneNumber,
    string? Email,
    Guid OwnerId,
    bool IsActive,
    DateTimeOffset CreatedAtUtc);
