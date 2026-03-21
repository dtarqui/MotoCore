namespace MotoCore.Application.Clients.Models;

public sealed record ClientStatisticsDto(
    int TotalClients,
    int ActiveClients,
    int InactiveClients,
    int NewClientsThisMonth,
    int ClientsWithPendingOrders);
