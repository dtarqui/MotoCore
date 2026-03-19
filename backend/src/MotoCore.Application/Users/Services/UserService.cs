using MotoCore.Application.Auth.Contracts;
using MotoCore.Application.Common.Results;
using MotoCore.Application.Users.Contracts;
using MotoCore.Application.Users.Models;
using MotoCore.Domain.Auth;

namespace MotoCore.Application.Users.Services;

public sealed class UserService(IUserIdentityRepository userRepository) : IUserService
{
    public async Task<Result<IReadOnlyList<UserDto>>> GetAllUsersAsync(CancellationToken cancellationToken = default)
    {
        var users = await userRepository.GetAllAsync(cancellationToken);
        return Result<IReadOnlyList<UserDto>>.Success(
            users.Select(MapToDto).ToList().AsReadOnly());
    }

    public async Task<Result<UserDto>> GetUserByIdAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await userRepository.GetByIdAsync(userId, cancellationToken);
        if (user is null)
        {
            return Result<UserDto>.Failure("user.not_found", "User not found.");
        }

        return Result<UserDto>.Success(MapToDto(user));
    }

    public async Task<Result<UserDto>> UpdateUserAsync(
        Guid userId,
        UpdateUserRequest request,
        string? modifiedByUserId,
        CancellationToken cancellationToken = default)
    {
        var user = await userRepository.GetByIdAsync(userId, cancellationToken);
        if (user is null)
        {
            return Result<UserDto>.Failure("user.not_found", "User not found.");
        }

        user.FirstName = request.FirstName;
        user.LastName = request.LastName;

        if (!string.IsNullOrWhiteSpace(request.Role))
        {
            if (!SystemRoles.IsSupported(request.Role))
            {
                return Result<UserDto>.Failure("user.invalid_role", "Invalid role.");
            }

            user.Role = request.Role;
        }

        await userRepository.UpdateAsync(user, cancellationToken);
        await userRepository.SaveChangesAsync(cancellationToken);

        return Result<UserDto>.Success(MapToDto(user));
    }

    public async Task<Result> DeleteUserAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await userRepository.GetByIdAsync(userId, cancellationToken);
        if (user is null)
        {
            return Result.Failure("user.not_found", "User not found.");
        }

        await userRepository.DeleteAsync(user, cancellationToken);
        await userRepository.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }

    private static UserDto MapToDto(UserAccount user) =>
        new(
            user.Id,
            user.Email,
            user.FirstName,
            user.LastName,
            user.Role,
            user.EmailConfirmed,
            user.CreatedAtUtc,
            user.UpdatedAtUtc);
}
