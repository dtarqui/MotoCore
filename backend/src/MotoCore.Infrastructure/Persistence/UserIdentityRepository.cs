using Microsoft.EntityFrameworkCore;
using MotoCore.Application.Auth.Contracts;
using MotoCore.Domain.Auth;

namespace MotoCore.Infrastructure.Persistence;

public sealed class UserIdentityRepository(MotoCoreDbContext dbContext) : IUserIdentityRepository
{
    public Task<int> CountAsync(CancellationToken cancellationToken = default) =>
        dbContext.Users.CountAsync(cancellationToken);

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

    public async Task AddAsync(UserAccount userAccount, CancellationToken cancellationToken = default) =>
        await dbContext.Users.AddAsync(userAccount, cancellationToken);

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) =>
        dbContext.SaveChangesAsync(cancellationToken);
}