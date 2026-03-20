namespace MotoCore.Application.Workshops.Models;

public sealed record UpdateWorkshopRequest(
    string Name,
    string? Description,
    string? Address,
    string? PhoneNumber,
    string? Email);
