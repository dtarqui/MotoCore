using System.Security.Claims;
using MotoCore.Api.Extensions;
using MotoCore.Api.Filters;
using MotoCore.Application.Common.Results;
using MotoCore.Application.Users.Contracts;
using MotoCore.Application.Users.Models;
using MotoCore.Domain.Auth;

namespace MotoCore.Api.Controllers;

public static class UserController
{
    public static IEndpointRouteBuilder MapUserEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/users")
            .WithTags("Users")
            .RequireAuthorization();

        group.MapGet("", GetAllUsers)
            .WithName("GetAllUsers")
            .WithSummary("List all users (Administrator only).");

        group.MapGet("/{userId:guid}", GetUserById)
            .WithName("GetUserById")
            .WithSummary("Get user details by ID.");

        group.MapPut("/{userId:guid}", UpdateUser)
            .WithName("UpdateUser")
            .WithSummary("Update user details (Administrator only).")
            .WithValidation<UpdateUserRequest>();

        group.MapDelete("/{userId:guid}", DeleteUser)
            .WithName("DeleteUser")
            .WithSummary("Delete a user account (Administrator only).");

        return app;
    }

    private static async Task<IResult> GetAllUsers(IUserService userService, ClaimsPrincipal user, CancellationToken cancellationToken)
    {
        if (!IsAdministrator(user))
        {
            return Results.Forbid();
        }

        var result = await userService.GetAllUsersAsync(cancellationToken);
        return result.ToHttpResult();
    }

    private static async Task<IResult> GetUserById(Guid userId, IUserService userService, ClaimsPrincipal user, CancellationToken cancellationToken)
    {
        var currentUserId = GetCurrentUserId(user);
        var isCurrentUser = Guid.TryParse(currentUserId, out var currentUserGuid) && userId == currentUserGuid;

        if (!IsAdministrator(user) && !isCurrentUser)
        {
            return Results.Forbid();
        }

        var result = await userService.GetUserByIdAsync(userId, cancellationToken);
        return result.ToHttpResult();
    }

    private static async Task<IResult> UpdateUser(
        Guid userId,
        UpdateUserRequest request,
        IUserService userService,
        ClaimsPrincipal user,
        CancellationToken cancellationToken)
    {
        if (!IsAdministrator(user))
        {
            return Results.Forbid();
        }

        var result = await userService.UpdateUserAsync(userId, request, GetCurrentUserId(user), cancellationToken);
        return result.ToHttpResult();
    }

    private static async Task<IResult> DeleteUser(Guid userId, IUserService userService, ClaimsPrincipal user, CancellationToken cancellationToken)
    {
        if (!IsAdministrator(user))
        {
            return Results.Forbid();
        }

        var result = await userService.DeleteUserAsync(userId, cancellationToken);
        return result.ToHttpResult();
    }

    private static bool IsAdministrator(ClaimsPrincipal user) =>
        user.FindFirst(ClaimTypes.Role)?.Value == SystemRoles.Administrator;

    private static string? GetCurrentUserId(ClaimsPrincipal user) =>
        user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
}
