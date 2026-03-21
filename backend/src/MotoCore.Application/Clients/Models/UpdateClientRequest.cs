namespace MotoCore.Application.Clients.Models;

public sealed record UpdateClientRequest(
    string FirstName,
    string LastName,
    string Email,
    string Phone,
    string? SecondaryPhone,
    string? Address,
    string? City,
    string? PostalCode,
    string? IdentificationNumber,
    string? CompanyName,
    string? TaxId,
    DateTimeOffset? BirthDate,
    string? PreferredContactMethod,
    string? Notes);
