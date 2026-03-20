using MotoCore.Api.Extensions;
using MotoCore.Api.Filters;
using MotoCore.Application.Users.Contracts;
using MotoCore.Application.Users.Models;
using System.Security.Claims;

namespace MotoCore.Api.Controllers;

public static class UserController
{
    public static IEndpointRouteBuilder MapUserEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/users")
            .WithTags("Users")
            .RequireAuthorization();

        group.MapGet("/me", GetCurrentUser)
            .WithName("GetCurrentUser")
            .WithSummary("Get the authenticated user's profile.");

        group.MapGet("/{userId:guid}", GetUserById)
            .WithName("GetUserById")
            .WithSummary("Get user details by ID.");

        group.MapPut("/{userId:guid}", UpdateUser)
            .WithName("UpdateUser")
            .WithSummary("Update user profile details.")
            .WithValidation<UpdateUserRequest>();

        return app;
    }

    private static async Task<IResult> GetCurrentUser(IUserService userService, ClaimsPrincipal user, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId(user);
        if (userId is null || !Guid.TryParse(userId, out var userGuid))
        {
            return Results.Unauthorized();
        }

        var result = await userService.GetUserByIdAsync(userGuid, cancellationToken);
        return result.ToHttpResult();
    }

    private static async Task<IResult> GetUserById(Guid userId, IUserService userService, ClaimsPrincipal user, CancellationToken cancellationToken)
    {
        var currentUserId = GetCurrentUserId(user);
        var isCurrentUser = Guid.TryParse(currentUserId, out var currentUserGuid) && userId == currentUserGuid;

        if (!isCurrentUser)
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
        var currentUserId = GetCurrentUserId(user);
        var isCurrentUser = Guid.TryParse(currentUserId, out var currentUserGuid) && userId == currentUserGuid;

        if (!isCurrentUser)
        {
            return Results.Forbid();
        }

        var result = await userService.UpdateUserAsync(userId, request, currentUserId, cancellationToken);
        return result.ToHttpResult();
    }

    private static string? GetCurrentUserId(ClaimsPrincipal user) =>
        user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
}
