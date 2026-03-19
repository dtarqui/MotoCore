using System.Security.Claims;
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
            .WithSummary("Update user details (Administrator only).");

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
        return ToHttpResult(result);
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
        return ToHttpResult(result);
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
        return ToHttpResult(result);
    }

    private static async Task<IResult> DeleteUser(Guid userId, IUserService userService, ClaimsPrincipal user, CancellationToken cancellationToken)
    {
        if (!IsAdministrator(user))
        {
            return Results.Forbid();
        }

        var result = await userService.DeleteUserAsync(userId, cancellationToken);
        return ToHttpResult(result);
    }

    private static bool IsAdministrator(ClaimsPrincipal user) =>
        user.FindFirst(ClaimTypes.Role)?.Value == SystemRoles.Administrator;

    private static string? GetCurrentUserId(ClaimsPrincipal user) =>
        user.FindFirst(ClaimTypes.NameIdentifier)?.Value;

    private static IResult ToHttpResult<T>(Result<T> result)
    {
        if (result.IsSuccess)
        {
            return Results.Ok(result.Value);
        }

        return ToProblemResult(result.Error!);
    }

    private static IResult ToHttpResult(Result result)
    {
        if (result.IsSuccess)
        {
            return Results.NoContent();
        }

        return ToProblemResult(result.Error!);
    }

    private static IResult ToProblemResult(Error error)
    {
        var statusCode = error.Code switch
        {
            "user.not_found" => StatusCodes.Status404NotFound,
            "user.invalid_role" => StatusCodes.Status400BadRequest,
            _ => StatusCodes.Status400BadRequest,
        };

        return Results.Problem(statusCode: statusCode, title: error.Code, detail: error.Message);
    }
}
