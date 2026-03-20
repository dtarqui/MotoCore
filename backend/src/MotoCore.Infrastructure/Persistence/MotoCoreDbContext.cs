using Microsoft.EntityFrameworkCore;
using MotoCore.Domain.Auth;
using MotoCore.Domain.Workshops;

namespace MotoCore.Infrastructure.Persistence;

public sealed class MotoCoreDbContext(DbContextOptions<MotoCoreDbContext> options) : DbContext(options)
{
    public DbSet<UserAccount> Users => Set<UserAccount>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<ExternalLogin> ExternalLogins => Set<ExternalLogin>();
    public DbSet<Workshop> Workshops => Set<Workshop>();
    public DbSet<WorkshopMembership> WorkshopMemberships => Set<WorkshopMembership>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        ConfigureUsers(modelBuilder);
        ConfigureRefreshTokens(modelBuilder);
        ConfigureExternalLogins(modelBuilder);
        ConfigureWorkshops(modelBuilder);
        ConfigureWorkshopMemberships(modelBuilder);
    }

    private static void ConfigureUsers(ModelBuilder modelBuilder)
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
    }

    private static void ConfigureRefreshTokens(ModelBuilder modelBuilder)
    {
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
    }

    private static void ConfigureExternalLogins(ModelBuilder modelBuilder)
    {
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

    private static void ConfigureWorkshops(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Workshop>(entity =>
        {
            entity.ToTable("workshops");
            entity.HasKey(workshop => workshop.Id);
            entity.Property(workshop => workshop.Name).HasMaxLength(200).IsRequired();
            entity.Property(workshop => workshop.Description).HasMaxLength(1000);
            entity.Property(workshop => workshop.Address).HasMaxLength(500);
            entity.Property(workshop => workshop.PhoneNumber).HasMaxLength(20);
            entity.Property(workshop => workshop.Email).HasMaxLength(256);
            entity.Property(workshop => workshop.OwnerId).IsRequired();
            entity.Property(workshop => workshop.IsActive).IsRequired();
            entity.HasIndex(workshop => workshop.OwnerId);
        });
    }

    private static void ConfigureWorkshopMemberships(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<WorkshopMembership>(entity =>
        {
            entity.ToTable("workshop_memberships");
            entity.HasKey(membership => membership.Id);
            entity.Property(membership => membership.Role).HasMaxLength(50).IsRequired();
            entity.Property(membership => membership.IsActive).IsRequired();

            entity.HasOne(membership => membership.Workshop)
                .WithMany()
                .HasForeignKey(membership => membership.WorkshopId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(membership => membership.UserAccount)
                .WithMany(user => user.WorkshopMemberships)
                .HasForeignKey(membership => membership.UserAccountId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(membership => new { membership.WorkshopId, membership.UserAccountId }).IsUnique();
        });
    }
}