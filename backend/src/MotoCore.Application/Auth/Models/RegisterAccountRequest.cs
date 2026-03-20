namespace MotoCore.Application.Auth.Models;

public sealed record RegisterAccountRequest(
    string Email,
    string Password,
    string FirstName,
    string LastName,
    string? Role,
    string? WorkshopName);