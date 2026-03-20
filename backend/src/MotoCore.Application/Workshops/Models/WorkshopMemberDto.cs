namespace MotoCore.Application.Workshops.Models;

public sealed record WorkshopMemberDto(
    Guid Id,
    Guid UserId,
    string Email,
    string FirstName,
    string LastName,
    string Role,
    bool IsActive,
    DateTimeOffset JoinedAtUtc);
