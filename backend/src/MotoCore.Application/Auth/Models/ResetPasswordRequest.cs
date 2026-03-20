namespace MotoCore.Application.Auth.Models;

public sealed record ResetPasswordRequest(string Email, string Token, string NewPassword);
