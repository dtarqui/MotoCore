using MotoCore.Api.Extensions;
using MotoCore.Application.Workshops.Contracts;
using MotoCore.Application.Workshops.Models;
using System.Security.Claims;

namespace MotoCore.Api.Controllers;

public static class WorkshopController
{
    public static IEndpointRouteBuilder MapWorkshopEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/workshops")
            .WithTags("Workshops")
            .RequireAuthorization();

        group.MapPost("/", CreateWorkshop)
            .WithName("CreateWorkshop")
            .WithSummary("Create a new workshop for the authenticated user.");

        group.MapGet("/", GetUserWorkshops)
            .WithName("GetUserWorkshops")
            .WithSummary("Get all workshops for the authenticated user.");

        group.MapGet("/{workshopId:guid}", GetWorkshopById)
            .WithName("GetWorkshopById")
            .WithSummary("Get workshop details by ID.");

        group.MapGet("/{workshopId:guid}/members", GetWorkshopMembers)
            .WithName("GetWorkshopMembers")
            .WithSummary("Get all members of a workshop.");

        group.MapPost("/{workshopId:guid}/members/invite", InviteUserToWorkshop)
            .WithName("InviteUserToWorkshop")
            .WithSummary("Invite a user to join the workshop.");

        group.MapDelete("/{workshopId:guid}/members/{memberId:guid}", RemoveMember)
            .WithName("RemoveMember")
            .WithSummary("Remove a member from the workshop.");

        group.MapPut("/{workshopId:guid}/members/{memberId:guid}/role", UpdateMemberRole)
            .WithName("UpdateMemberRole")
            .WithSummary("Update a member's role in the workshop.");

        return app;
    }

    private static async Task<IResult> CreateWorkshop(
        CreateWorkshopRequest request,
        ClaimsPrincipal user,
        IWorkshopService workshopService,
        CancellationToken cancellationToken)
    {
        var userId = GetUserId(user);
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var result = await workshopService.CreateWorkshopAsync(userId.Value, request, cancellationToken);
        return result.IsSuccess ? Results.Created($"/api/workshops/{result.Value!.Id}", result.Value) : result.ToHttpResult();
    }

    private static async Task<IResult> GetUserWorkshops(
        ClaimsPrincipal user,
        IWorkshopService workshopService,
        CancellationToken cancellationToken)
    {
        var userId = GetUserId(user);
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var result = await workshopService.GetUserWorkshopsAsync(userId.Value, cancellationToken);
        return result.ToHttpResult();
    }

    private static async Task<IResult> GetWorkshopById(
        Guid workshopId,
        ClaimsPrincipal user,
        IWorkshopService workshopService,
        CancellationToken cancellationToken)
    {
        var userId = GetUserId(user);
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var result = await workshopService.GetWorkshopByIdAsync(workshopId, userId.Value, cancellationToken);
        return result.ToHttpResult();
    }

    private static async Task<IResult> GetWorkshopMembers(
        Guid workshopId,
        ClaimsPrincipal user,
        IWorkshopService workshopService,
        CancellationToken cancellationToken)
    {
        var userId = GetUserId(user);
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var result = await workshopService.GetWorkshopMembersAsync(workshopId, userId.Value, cancellationToken);
        return result.ToHttpResult();
    }

    private static async Task<IResult> InviteUserToWorkshop(
        Guid workshopId,
        InviteUserRequest request,
        ClaimsPrincipal user,
        IWorkshopService workshopService,
        CancellationToken cancellationToken)
    {
        var userId = GetUserId(user);
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var result = await workshopService.InviteUserToWorkshopAsync(workshopId, userId.Value, request, cancellationToken);
        return result.IsSuccess ? Results.Ok() : result.ToHttpResult();
    }

    private static async Task<IResult> RemoveMember(
        Guid workshopId,
        Guid memberId,
        ClaimsPrincipal user,
        IWorkshopService workshopService,
        CancellationToken cancellationToken)
    {
        var userId = GetUserId(user);
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var result = await workshopService.RemoveMemberAsync(workshopId, memberId, userId.Value, cancellationToken);
        return result.IsSuccess ? Results.NoContent() : result.ToHttpResult();
    }

    private static async Task<IResult> UpdateMemberRole(
        Guid workshopId,
        Guid memberId,
        UpdateMemberRoleRequest request,
        ClaimsPrincipal user,
        IWorkshopService workshopService,
        CancellationToken cancellationToken)
    {
        var userId = GetUserId(user);
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var result = await workshopService.UpdateMemberRoleAsync(workshopId, memberId, request.Role, userId.Value, cancellationToken);
        return result.IsSuccess ? Results.Ok() : result.ToHttpResult();
    }

    private static Guid? GetUserId(ClaimsPrincipal user)
    {
        var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(userIdClaim, out var userId) ? userId : null;
    }

    private sealed record UpdateMemberRoleRequest(string Role);
}
