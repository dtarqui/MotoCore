using MotoCore.Domain.Auth;

namespace MotoCore.Application.Auth.Contracts;

public interface IPasswordHashingService
{
    string HashPassword(UserAccount userAccount, string password);
    bool VerifyPassword(UserAccount userAccount, string password);
}