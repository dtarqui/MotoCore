namespace MotoCore.Application.Auth.Contracts;

public interface IRefreshTokenProtector
{
    string GenerateToken();
    string HashToken(string token);
}