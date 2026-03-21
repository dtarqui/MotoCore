namespace MotoCore.Application.Clients.Models;

public sealed record ClientSummaryDto(
    Guid Id,
    string FullName,
    string Email,
    string Phone,
    int TotalVehicles,
    int TotalWorkOrders,
    DateTimeOffset? LastServiceDate,
    decimal TotalSpent);
