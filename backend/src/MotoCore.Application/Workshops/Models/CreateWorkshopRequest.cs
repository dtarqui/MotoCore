namespace MotoCore.Application.Workshops.Models;

public sealed record CreateWorkshopRequest(
    string Name,
    string? Description,
    string? Address,
    string? PhoneNumber,
    string? Email);
