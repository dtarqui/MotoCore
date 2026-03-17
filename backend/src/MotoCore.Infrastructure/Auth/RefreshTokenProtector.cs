using System.Security.Cryptography;
using System.Text;
using MotoCore.Application.Auth.Contracts;

namespace MotoCore.Infrastructure.Auth;

public sealed class RefreshTokenProtector : IRefreshTokenProtector
{
    public string GenerateToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(64);
        return Convert.ToBase64String(bytes);
    }

    public string HashToken(string token)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToHexString(bytes);
    }
}