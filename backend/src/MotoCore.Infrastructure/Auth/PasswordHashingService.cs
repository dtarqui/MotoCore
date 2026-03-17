using Microsoft.AspNetCore.Identity;
using MotoCore.Application.Auth.Contracts;
using MotoCore.Domain.Auth;

namespace MotoCore.Infrastructure.Auth;

public sealed class PasswordHashingService : IPasswordHashingService
{
    private readonly PasswordHasher<UserAccount> _passwordHasher = new();

    public string HashPassword(UserAccount userAccount, string password) =>
        _passwordHasher.HashPassword(userAccount, password);

    public bool VerifyPassword(UserAccount userAccount, string password)
    {
        var result = _passwordHasher.VerifyHashedPassword(userAccount, userAccount.PasswordHash, password);
        return result is PasswordVerificationResult.Success or PasswordVerificationResult.SuccessRehashNeeded;
    }
}