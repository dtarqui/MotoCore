using MotoCore.Application.Common.Results;
using MotoCore.Application.Users.Models;

namespace MotoCore.Application.Users.Contracts;

public interface IUserService
{
    Task<Result<IReadOnlyList<UserDto>>> GetAllUsersAsync(CancellationToken cancellationToken = default);
    Task<Result<UserDto>> GetUserByIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<Result<UserDto>> UpdateUserAsync(Guid userId, UpdateUserRequest request, string? modifiedByUserId, CancellationToken cancellationToken = default);
    Task<Result<UserDto>> UpdateUserRoleAsync(Guid userId, UpdateUserRoleRequest request, string? modifiedByUserId, CancellationToken cancellationToken = default);
    Task<Result> DeleteUserAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<Result<UserStatisticsDto>> GetStatisticsAsync(CancellationToken cancellationToken = default);
}
