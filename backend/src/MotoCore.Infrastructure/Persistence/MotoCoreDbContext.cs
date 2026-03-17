using Microsoft.EntityFrameworkCore;
using MotoCore.Domain.Auth;

namespace MotoCore.Infrastructure.Persistence;

public sealed class MotoCoreDbContext(DbContextOptions<MotoCoreDbContext> options) : DbContext(options)
{
    public DbSet<UserAccount> Users => Set<UserAccount>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<ExternalLogin> ExternalLogins => Set<ExternalLogin>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<UserAccount>(entity =>
        {
            entity.ToTable("users");
            entity.HasKey(user => user.Id);
            entity.Property(user => user.Email).HasMaxLength(256).IsRequired();
            entity.Property(user => user.NormalizedEmail).HasMaxLength(256).IsRequired();
            entity.Property(user => user.PasswordHash).IsRequired();
            entity.Property(user => user.FirstName).HasMaxLength(100).IsRequired();
            entity.Property(user => user.LastName).HasMaxLength(100).IsRequired();
            entity.Property(user => user.Role).HasMaxLength(50).IsRequired();
            entity.HasIndex(user => user.NormalizedEmail).IsUnique();
            entity.HasMany(user => user.RefreshTokens)
                .WithOne(refreshToken => refreshToken.UserAccount)
                .HasForeignKey(refreshToken => refreshToken.UserAccountId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasMany(user => user.ExternalLogins)
                .WithOne(externalLogin => externalLogin.UserAccount)
                .HasForeignKey(externalLogin => externalLogin.UserAccountId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.ToTable("refresh_tokens");
            entity.HasKey(refreshToken => refreshToken.Id);
            entity.Property(refreshToken => refreshToken.TokenHash).HasMaxLength(128).IsRequired();
            entity.Property(refreshToken => refreshToken.CreatedByIp).HasMaxLength(64);
            entity.Property(refreshToken => refreshToken.RevokedByIp).HasMaxLength(64);
            entity.Property(refreshToken => refreshToken.ReplacedByTokenHash).HasMaxLength(128);
            entity.HasIndex(refreshToken => refreshToken.TokenHash).IsUnique();
        });

        modelBuilder.Entity<ExternalLogin>(entity =>
        {
            entity.ToTable("external_logins");
            entity.HasKey(externalLogin => externalLogin.Id);
            entity.Property(externalLogin => externalLogin.Provider).HasMaxLength(100).IsRequired();
            entity.Property(externalLogin => externalLogin.ProviderSubject).HasMaxLength(256).IsRequired();
            entity.Property(externalLogin => externalLogin.Email).HasMaxLength(256);
            entity.HasIndex(externalLogin => new { externalLogin.Provider, externalLogin.ProviderSubject }).IsUnique();
        });
    }
}