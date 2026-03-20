namespace MotoCore.Application.Users.Models;

public record UserStatisticsDto(
    int TotalUsers,
    int ConfirmedUsers,
    int UnconfirmedUsers,
    Dictionary<string, int> UsersByRole);
