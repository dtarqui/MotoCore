using MotoCore.Domain.Auth;

namespace MotoCore.Application.Auth.Contracts;

public interface IUserIdentityRepository
{
    Task<int> CountAsync(CancellationToken cancellationToken = default);
    Task<UserAccount?> GetByEmailAsync(string normalizedEmail, CancellationToken cancellationToken = default);
    Task<UserAccount?> GetByRefreshTokenHashAsync(string refreshTokenHash, CancellationToken cancellationToken = default);
    Task AddAsync(UserAccount userAccount, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}