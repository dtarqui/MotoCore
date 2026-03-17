namespace MotoCore.Application.Auth.Models;

public sealed record AccessTokenResult(string Token, DateTimeOffset ExpiresAtUtc);