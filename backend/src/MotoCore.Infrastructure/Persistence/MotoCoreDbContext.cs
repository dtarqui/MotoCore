using Microsoft.EntityFrameworkCore;
using MotoCore.Domain.Auth;
using MotoCore.Domain.Clients;
using MotoCore.Domain.Inventory;
using MotoCore.Domain.Motorcycles;
using MotoCore.Domain.WorkOrders;
using MotoCore.Domain.Workshops;

namespace MotoCore.Infrastructure.Persistence;

public sealed class MotoCoreDbContext(DbContextOptions<MotoCoreDbContext> options) : DbContext(options)
{
    public DbSet<UserAccount> Users => Set<UserAccount>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<ExternalLogin> ExternalLogins => Set<ExternalLogin>();
    public DbSet<Workshop> Workshops => Set<Workshop>();
    public DbSet<WorkshopMembership> WorkshopMemberships => Set<WorkshopMembership>();
    public DbSet<Client> Clients => Set<Client>();
    public DbSet<Motorcycle> Motorcycles => Set<Motorcycle>();
    public DbSet<WorkOrder> WorkOrders => Set<WorkOrder>();
    public DbSet<Part> Parts => Set<Part>();
    public DbSet<PartMovement> PartMovements => Set<PartMovement>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        ConfigureUsers(modelBuilder);
        ConfigureRefreshTokens(modelBuilder);
        ConfigureExternalLogins(modelBuilder);
        ConfigureWorkshops(modelBuilder);
        ConfigureWorkshopMemberships(modelBuilder);
        ConfigureClients(modelBuilder);
        ConfigureMotorcycles(modelBuilder);
        ConfigureWorkOrders(modelBuilder);
        ConfigureParts(modelBuilder);
        ConfigurePartMovements(modelBuilder);
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
            entity.Property(user => user.EmailConfirmationToken).HasMaxLength(256);
            entity.Property(user => user.PasswordResetToken).HasMaxLength(256);
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

    private static void ConfigureClients(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Client>(entity =>
        {
            entity.ToTable("clients");

            entity.HasKey(c => c.Id);

            entity.Property(c => c.Id)
                .HasColumnName("id")
                .ValueGeneratedNever();

            entity.Property(c => c.WorkshopId)
                .HasColumnName("workshop_id")
                .IsRequired();

            entity.Property(c => c.FirstName)
                .HasColumnName("first_name")
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(c => c.LastName)
                .HasColumnName("last_name")
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(c => c.Email)
                .HasColumnName("email")
                .HasMaxLength(256)
                .IsRequired();

            entity.Property(c => c.Phone)
                .HasColumnName("phone")
                .HasMaxLength(20)
                .IsRequired();

            entity.Property(c => c.SecondaryPhone)
                .HasColumnName("secondary_phone")
                .HasMaxLength(20);

            entity.Property(c => c.Address)
                .HasColumnName("address")
                .HasMaxLength(200);

            entity.Property(c => c.City)
                .HasColumnName("city")
                .HasMaxLength(100);

            entity.Property(c => c.PostalCode)
                .HasColumnName("postal_code")
                .HasMaxLength(20);

            entity.Property(c => c.IdentificationNumber)
                .HasColumnName("identification_number")
                .HasMaxLength(50);

            entity.Property(c => c.CompanyName)
                .HasColumnName("company_name")
                .HasMaxLength(200);

            entity.Property(c => c.TaxId)
                .HasColumnName("tax_id")
                .HasMaxLength(50);

            entity.Property(c => c.BirthDate)
                .HasColumnName("birth_date");

            entity.Property(c => c.PreferredContactMethod)
                .HasColumnName("preferred_contact_method")
                .HasMaxLength(50);

            entity.Property(c => c.Notes)
                .HasColumnName("notes")
                .HasMaxLength(1000);

            entity.Property(c => c.IsActive)
                .HasColumnName("is_active")
                .HasDefaultValue(true)
                .IsRequired();

            entity.Property(c => c.CreatedAtUtc)
                .HasColumnName("created_at_utc")
                .HasDefaultValueSql("NOW()")
                .ValueGeneratedOnAdd();

            entity.Property(c => c.UpdatedAtUtc)
                .HasColumnName("updated_at_utc");

            entity.HasIndex(c => c.WorkshopId)
                .HasDatabaseName("ix_clients_workshop_id");

            entity.HasIndex(c => new { c.WorkshopId, c.Email })
                .IsUnique()
                .HasDatabaseName("ix_clients_workshop_id_email");
        });
    }

    private static void ConfigureMotorcycles(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Motorcycle>(entity =>
        {
            entity.ToTable("motorcycles");

            entity.HasKey(m => m.Id);

            entity.Property(m => m.Id)
                .HasColumnName("id")
                .ValueGeneratedNever();

            entity.Property(m => m.WorkshopId)
                .HasColumnName("workshop_id")
                .IsRequired();

            entity.Property(m => m.ClientId)
                .HasColumnName("client_id")
                .IsRequired();

            entity.Property(m => m.Brand)
                .HasColumnName("brand")
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(m => m.Model)
                .HasColumnName("model")
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(m => m.Year)
                .HasColumnName("year")
                .IsRequired();

            entity.Property(m => m.LicensePlate)
                .HasColumnName("license_plate")
                .HasMaxLength(20)
                .IsRequired();

            entity.Property(m => m.Vin)
                .HasColumnName("vin")
                .HasMaxLength(50);

            entity.Property(m => m.Color)
                .HasColumnName("color")
                .HasMaxLength(50);

            entity.Property(m => m.Mileage)
                .HasColumnName("mileage");

            entity.Property(m => m.EngineSize)
                .HasColumnName("engine_size")
                .HasMaxLength(50);

            entity.Property(m => m.Notes)
                .HasColumnName("notes")
                .HasMaxLength(2000);

            entity.Property(m => m.IsActive)
                .HasColumnName("is_active")
                .HasDefaultValue(true)
                .IsRequired();

            entity.Property(m => m.CreatedAtUtc)
                .HasColumnName("created_at_utc")
                .HasDefaultValueSql("NOW()")
                .ValueGeneratedOnAdd();

            entity.Property(m => m.UpdatedAtUtc)
                .HasColumnName("updated_at_utc");

            entity.HasIndex(m => m.WorkshopId)
                .HasDatabaseName("ix_motorcycles_workshop_id");

            entity.HasIndex(m => m.ClientId)
                .HasDatabaseName("ix_motorcycles_client_id");

            entity.HasIndex(m => new { m.WorkshopId, m.LicensePlate })
                .IsUnique()
                .HasDatabaseName("ix_motorcycles_workshop_id_license_plate");
        });
    }

    private static void ConfigureWorkOrders(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<WorkOrder>(entity =>
        {
            entity.ToTable("work_orders");

            entity.HasKey(wo => wo.Id);

            entity.Property(wo => wo.Id)
                .HasColumnName("id")
                .ValueGeneratedNever();

            entity.Property(wo => wo.WorkshopId)
                .HasColumnName("workshop_id")
                .IsRequired();

            entity.Property(wo => wo.MotorcycleId)
                .HasColumnName("motorcycle_id")
                .IsRequired();

            entity.Property(wo => wo.OrderNumber)
                .HasColumnName("order_number")
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(wo => wo.Status)
                .HasColumnName("status")
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(wo => wo.Description)
                .HasColumnName("description")
                .HasMaxLength(2000);

            entity.Property(wo => wo.Diagnosis)
                .HasColumnName("diagnosis")
                .HasMaxLength(2000);

            entity.Property(wo => wo.CurrentMileage)
                .HasColumnName("current_mileage");

            entity.Property(wo => wo.EstimatedCost)
                .HasColumnName("estimated_cost")
                .HasColumnType("decimal(18,2)")
                .HasDefaultValue(0);

            entity.Property(wo => wo.FinalCost)
                .HasColumnName("final_cost")
                .HasColumnType("decimal(18,2)")
                .HasDefaultValue(0);

            entity.Property(wo => wo.ScheduledDate)
                .HasColumnName("scheduled_date");

            entity.Property(wo => wo.StartedAtUtc)
                .HasColumnName("started_at_utc");

            entity.Property(wo => wo.CompletedAtUtc)
                .HasColumnName("completed_at_utc");

            entity.Property(wo => wo.DeliveredAtUtc)
                .HasColumnName("delivered_at_utc");

            entity.Property(wo => wo.CreatedByUserId)
                .HasColumnName("created_by_user_id")
                .IsRequired();

            entity.Property(wo => wo.AssignedMechanicUserId)
                .HasColumnName("assigned_mechanic_user_id");

            entity.Property(wo => wo.Notes)
                .HasColumnName("notes")
                .HasMaxLength(2000);

            entity.Property(wo => wo.IsActive)
                .HasColumnName("is_active")
                .HasDefaultValue(true)
                .IsRequired();

            entity.Property(wo => wo.CreatedAtUtc)
                .HasColumnName("created_at_utc")
                .HasDefaultValueSql("NOW()")
                .ValueGeneratedOnAdd();

            entity.Property(wo => wo.UpdatedAtUtc)
                .HasColumnName("updated_at_utc");

            entity.HasIndex(wo => wo.WorkshopId)
                .HasDatabaseName("ix_work_orders_workshop_id");

            entity.HasIndex(wo => wo.MotorcycleId)
                .HasDatabaseName("ix_work_orders_motorcycle_id");

            entity.HasIndex(wo => new { wo.WorkshopId, wo.OrderNumber })
                .IsUnique()
                .HasDatabaseName("ix_work_orders_workshop_id_order_number");

            entity.HasIndex(wo => wo.Status)
                .HasDatabaseName("ix_work_orders_status");
        });
    }

    private static void ConfigureParts(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Part>(entity =>
        {
            entity.ToTable("parts");

            entity.HasKey(p => p.Id);

            entity.Property(p => p.Id)
                .HasColumnName("id")
                .ValueGeneratedNever();

            entity.Property(p => p.WorkshopId)
                .HasColumnName("workshop_id")
                .IsRequired();

            entity.Property(p => p.PartNumber)
                .HasColumnName("part_number")
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(p => p.Name)
                .HasColumnName("name")
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(p => p.Description)
                .HasColumnName("description")
                .HasMaxLength(1000);

            entity.Property(p => p.Brand)
                .HasColumnName("brand")
                .HasMaxLength(100);

            entity.Property(p => p.Category)
                .HasColumnName("category")
                .HasMaxLength(100);

            entity.Property(p => p.CurrentStock)
                .HasColumnName("current_stock")
                .HasDefaultValue(0);

            entity.Property(p => p.MinimumStock)
                .HasColumnName("minimum_stock")
                .HasDefaultValue(0);

            entity.Property(p => p.MaximumStock)
                .HasColumnName("maximum_stock")
                .HasDefaultValue(0);

            entity.Property(p => p.UnitCost)
                .HasColumnName("unit_cost")
                .HasColumnType("decimal(18,2)")
                .HasDefaultValue(0);

            entity.Property(p => p.SalePrice)
                .HasColumnName("sale_price")
                .HasColumnType("decimal(18,2)")
                .HasDefaultValue(0);

            entity.Property(p => p.Location)
                .HasColumnName("location")
                .HasMaxLength(100);

            entity.Property(p => p.SupplierName)
                .HasColumnName("supplier_name")
                .HasMaxLength(200);

            entity.Property(p => p.SupplierContact)
                .HasColumnName("supplier_contact")
                .HasMaxLength(200);

            entity.Property(p => p.Notes)
                .HasColumnName("notes")
                .HasMaxLength(1000);

            entity.Property(p => p.IsActive)
                .HasColumnName("is_active")
                .HasDefaultValue(true)
                .IsRequired();

            entity.Property(p => p.CreatedAtUtc)
                .HasColumnName("created_at_utc")
                .HasDefaultValueSql("NOW()")
                .ValueGeneratedOnAdd();

            entity.Property(p => p.UpdatedAtUtc)
                .HasColumnName("updated_at_utc");

            entity.HasIndex(p => p.WorkshopId)
                .HasDatabaseName("ix_parts_workshop_id");

            entity.HasIndex(p => new { p.WorkshopId, p.PartNumber })
                .IsUnique()
                .HasDatabaseName("ix_parts_workshop_id_part_number");

            entity.HasIndex(p => p.Category)
                .HasDatabaseName("ix_parts_category");
        });
    }

    private static void ConfigurePartMovements(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<PartMovement>(entity =>
        {
            entity.ToTable("part_movements");

            entity.HasKey(pm => pm.Id);

            entity.Property(pm => pm.Id)
                .HasColumnName("id")
                .ValueGeneratedNever();

            entity.Property(pm => pm.WorkshopId)
                .HasColumnName("workshop_id")
                .IsRequired();

            entity.Property(pm => pm.PartId)
                .HasColumnName("part_id")
                .IsRequired();

            entity.Property(pm => pm.MovementType)
                .HasColumnName("movement_type")
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(pm => pm.Quantity)
                .HasColumnName("quantity")
                .IsRequired();

            entity.Property(pm => pm.PreviousStock)
                .HasColumnName("previous_stock")
                .IsRequired();

            entity.Property(pm => pm.NewStock)
                .HasColumnName("new_stock")
                .IsRequired();

            entity.Property(pm => pm.UnitCost)
                .HasColumnName("unit_cost")
                .HasColumnType("decimal(18,2)");

            entity.Property(pm => pm.TotalCost)
                .HasColumnName("total_cost")
                .HasColumnType("decimal(18,2)");

            entity.Property(pm => pm.WorkOrderId)
                .HasColumnName("work_order_id");

            entity.Property(pm => pm.CreatedByUserId)
                .HasColumnName("created_by_user_id")
                .IsRequired();

            entity.Property(pm => pm.Reference)
                .HasColumnName("reference")
                .HasMaxLength(200);

            entity.Property(pm => pm.Notes)
                .HasColumnName("notes")
                .HasMaxLength(1000);

            entity.Property(pm => pm.CreatedAtUtc)
                .HasColumnName("created_at_utc")
                .HasDefaultValueSql("NOW()")
                .ValueGeneratedOnAdd();

            entity.HasIndex(pm => pm.WorkshopId)
                .HasDatabaseName("ix_part_movements_workshop_id");

            entity.HasIndex(pm => pm.PartId)
                .HasDatabaseName("ix_part_movements_part_id");

            entity.HasIndex(pm => pm.WorkOrderId)
                .HasDatabaseName("ix_part_movements_work_order_id");

            entity.HasIndex(pm => pm.MovementType)
                .HasDatabaseName("ix_part_movements_movement_type");
        });
    }
}
