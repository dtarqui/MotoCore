using Microsoft.EntityFrameworkCore;
using MotoCore.Application.Auth.Contracts;
using MotoCore.Domain.Auth;

namespace MotoCore.Infrastructure.Persistence;

public sealed class UserIdentityRepository(MotoCoreDbContext dbContext) : IUserIdentityRepository
{
    public Task<int> CountAsync(CancellationToken cancellationToken = default) =>
        dbContext.Users.CountAsync(cancellationToken);

    public Task<UserAccount?> GetByIdAsync(Guid userId, CancellationToken cancellationToken = default) =>
        dbContext.Users
            .Include(user => user.RefreshTokens)
            .Include(user => user.ExternalLogins)
            .FirstOrDefaultAsync(user => user.Id == userId, cancellationToken);

    public Task<UserAccount?> GetByEmailAsync(string normalizedEmail, CancellationToken cancellationToken = default) =>
        dbContext.Users
            .Include(user => user.RefreshTokens)
            .Include(user => user.ExternalLogins)
            .SingleOrDefaultAsync(user => user.NormalizedEmail == normalizedEmail, cancellationToken);

    public Task<UserAccount?> GetByRefreshTokenHashAsync(string refreshTokenHash, CancellationToken cancellationToken = default) =>
        dbContext.Users
            .Include(user => user.RefreshTokens)
            .Include(user => user.ExternalLogins)
            .SingleOrDefaultAsync(
                user => user.RefreshTokens.Any(refreshToken => refreshToken.TokenHash == refreshTokenHash),
                cancellationToken);

    public Task<IReadOnlyList<UserAccount>> GetAllAsync(CancellationToken cancellationToken = default) =>
        dbContext.Users
            .Include(user => user.RefreshTokens)
            .Include(user => user.ExternalLogins)
            .OrderBy(user => user.Email)
            .ToListAsync(cancellationToken)
            .ContinueWith(task => (IReadOnlyList<UserAccount>)task.Result, cancellationToken);

    public async Task AddAsync(UserAccount userAccount, CancellationToken cancellationToken = default) =>
        await dbContext.Users.AddAsync(userAccount, cancellationToken);

    public async Task AddRefreshTokenAsync(RefreshToken refreshToken, CancellationToken cancellationToken = default) =>
        await dbContext.RefreshTokens.AddAsync(refreshToken, cancellationToken);

    public Task UpdateAsync(UserAccount userAccount, CancellationToken cancellationToken = default)
    {
        userAccount.UpdatedAtUtc = DateTimeOffset.UtcNow;
        dbContext.Users.Update(userAccount);
        return Task.CompletedTask;
    }

    public Task DeleteAsync(UserAccount userAccount, CancellationToken cancellationToken = default)
    {
        dbContext.Users.Remove(userAccount);
        return Task.CompletedTask;
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) =>
        dbContext.SaveChangesAsync(cancellationToken);
}