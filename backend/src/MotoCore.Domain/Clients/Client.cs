namespace MotoCore.Domain.Clients;

public sealed class Client
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid WorkshopId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? SecondaryPhone { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? PostalCode { get; set; }
    public string? IdentificationNumber { get; set; }
    public string? CompanyName { get; set; }
    public string? TaxId { get; set; }
    public DateTimeOffset? BirthDate { get; set; }
    public string? PreferredContactMethod { get; set; }
    public string? Notes { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? UpdatedAtUtc { get; set; }
}
