using MotoCore.Api.Extensions;
using MotoCore.Api.Filters;
using MotoCore.Application.Users.Contracts;
using MotoCore.Application.Users.Models;
using MotoCore.Domain.Auth;
using System.Security.Claims;

namespace MotoCore.Api.Controllers;

public static class UserController
{
    public static IEndpointRouteBuilder MapUserEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/users")
            .WithTags("Users")
            .RequireAuthorization();

        group.MapGet("/", GetAllUsers)
            .WithName("GetAllUsers")
            .WithSummary("Get all users in the system.")
            .RequireAuthorization(policy => policy.RequireRole(SystemRoles.Owner));

        group.MapGet("/statistics", GetStatistics)
            .WithName("GetUserStatistics")
            .WithSummary("Get user statistics (Owner only).")
            .RequireAuthorization(policy => policy.RequireRole(SystemRoles.Owner));

        group.MapGet("/me", GetCurrentUser)
            .WithName("GetCurrentUser")
            .WithSummary("Get the authenticated user's profile.");

        group.MapGet("/{userId:guid}", GetUserById)
            .WithName("GetUserById")
            .WithSummary("Get user details by ID.");

        group.MapPut("/me", UpdateCurrentUser)
            .WithName("UpdateCurrentUser")
            .WithSummary("Update the authenticated user's profile.")
            .WithValidation<UpdateUserRequest>();

        group.MapPut("/{userId:guid}", UpdateUser)
            .WithName("UpdateUser")
            .WithSummary("Update user profile details (Owner only).")
            .WithValidation<UpdateUserRequest>()
            .RequireAuthorization(policy => policy.RequireRole(SystemRoles.Owner));

        group.MapPatch("/{userId:guid}/role", UpdateUserRole)
            .WithName("UpdateUserRole")
            .WithSummary("Update user role (Owner only).")
            .WithValidation<UpdateUserRoleRequest>()
            .RequireAuthorization(policy => policy.RequireRole(SystemRoles.Owner));

        group.MapDelete("/{userId:guid}", DeleteUser)
            .WithName("DeleteUser")
            .WithSummary("Delete a user (Owner only).")
            .RequireAuthorization(policy => policy.RequireRole(SystemRoles.Owner));

        return app;
    }

    private static async Task<IResult> GetAllUsers(IUserService userService, CancellationToken cancellationToken)
    {
        var result = await userService.GetAllUsersAsync(cancellationToken);
        return result.ToHttpResult();
    }

    private static async Task<IResult> GetStatistics(IUserService userService, CancellationToken cancellationToken)
    {
        var result = await userService.GetStatisticsAsync(cancellationToken);
        return result.ToHttpResult();
    }

    private static async Task<IResult> GetCurrentUser(IUserService userService, HttpContext httpContext, CancellationToken cancellationToken)
    {
        var userId = httpContext.User.GetUserId();

        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var result = await userService.GetUserByIdAsync(userId.Value, cancellationToken);
        return result.ToHttpResult();
    }

    private static async Task<IResult> GetUserById(Guid userId, IUserService userService, HttpContext httpContext, CancellationToken cancellationToken)
    {
        var currentUserId = httpContext.User.GetUserId();
        var userRole = httpContext.User.GetUserRole();

        if (currentUserId is null)
        {
            return Results.Unauthorized();
        }

        var isCurrentUser = userId == currentUserId.Value;
        var isOwner = userRole == SystemRoles.Owner;

        if (!isCurrentUser && !isOwner)
        {
            return Results.Forbid();
        }

        var result = await userService.GetUserByIdAsync(userId, cancellationToken);
        return result.ToHttpResult();
    }

    private static async Task<IResult> UpdateCurrentUser(
        UpdateUserRequest request,
        IUserService userService,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        var userId = httpContext.User.GetUserId();

        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var result = await userService.UpdateUserAsync(userId.Value, request, userId.Value.ToString(), cancellationToken);
        return result.ToHttpResult();
    }

    private static async Task<IResult> UpdateUser(
        Guid userId,
        UpdateUserRequest request,
        IUserService userService,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        var currentUserId = httpContext.User.GetUserId();

        if (currentUserId is null)
        {
            return Results.Unauthorized();
        }

        var result = await userService.UpdateUserAsync(userId, request, currentUserId.Value.ToString(), cancellationToken);
        return result.ToHttpResult();
    }

    private static async Task<IResult> UpdateUserRole(
        Guid userId,
        UpdateUserRoleRequest request,
        IUserService userService,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        var currentUserId = httpContext.User.GetUserId();

        if (currentUserId is null)
        {
            return Results.Unauthorized();
        }

        if (userId == currentUserId.Value)
        {
            return Results.BadRequest(new { error = "user.cannot_change_own_role", message = "You cannot change your own role." });
        }

        var result = await userService.UpdateUserRoleAsync(userId, request, currentUserId.Value.ToString(), cancellationToken);
        return result.ToHttpResult();
    }

    private static async Task<IResult> DeleteUser(
        Guid userId,
        IUserService userService,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        var currentUserId = httpContext.User.GetUserId();

        if (currentUserId is null)
        {
            return Results.Unauthorized();
        }

        if (userId == currentUserId.Value)
        {
            return Results.BadRequest(new { error = "user.cannot_delete_self", message = "You cannot delete your own account." });
        }

        var result = await userService.DeleteUserAsync(userId, cancellationToken);

        if (result.IsSuccess)
        {
            return Results.NoContent();
        }

        return result.ToHttpResult();
    }
}
