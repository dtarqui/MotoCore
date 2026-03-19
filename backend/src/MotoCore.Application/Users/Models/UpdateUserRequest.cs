namespace MotoCore.Application.Users.Models;

public record UpdateUserRequest(
    string FirstName,
    string LastName,
    string? Role = null);
