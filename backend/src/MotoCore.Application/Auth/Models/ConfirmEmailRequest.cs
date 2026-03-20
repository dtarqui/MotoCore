namespace MotoCore.Application.Auth.Models;

public sealed record ConfirmEmailRequest(string Email, string Token);
