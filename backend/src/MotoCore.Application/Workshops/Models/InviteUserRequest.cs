namespace MotoCore.Application.Workshops.Models;

public sealed record InviteUserRequest(
    string Email,
    string Role);
