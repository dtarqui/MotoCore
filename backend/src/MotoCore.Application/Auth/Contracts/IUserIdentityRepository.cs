using MotoCore.Domain.Auth;

namespace MotoCore.Application.Auth.Contracts;

public interface IUserIdentityRepository
{
    Task<int> CountAsync(CancellationToken cancellationToken = default);
    Task<UserAccount?> GetByIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<UserAccount?> GetByEmailAsync(string normalizedEmail, CancellationToken cancellationToken = default);
    Task<UserAccount?> GetByRefreshTokenHashAsync(string refreshTokenHash, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<UserAccount>> GetAllAsync(CancellationToken cancellationToken = default);
    Task AddAsync(UserAccount userAccount, CancellationToken cancellationToken = default);
    Task AddRefreshTokenAsync(RefreshToken refreshToken, CancellationToken cancellationToken = default);
    Task UpdateAsync(UserAccount userAccount, CancellationToken cancellationToken = default);
    Task DeleteAsync(UserAccount userAccount, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}