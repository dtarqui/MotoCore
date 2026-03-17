namespace MotoCore.Application.Auth.Models;

public sealed record UserAccountResponse(
    Guid Id,
    string Email,
    string FirstName,
    string LastName,
    string Role);