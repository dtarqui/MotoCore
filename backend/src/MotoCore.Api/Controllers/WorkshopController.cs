using MotoCore.Api.Extensions;
using MotoCore.Api.Filters;
using MotoCore.Application.Workshops.Contracts;
using MotoCore.Application.Workshops.Models;
using MotoCore.Domain.Auth;

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
            .WithSummary("Create a new workshop (Owner only).")
            .WithValidation<CreateWorkshopRequest>()
            .RequireAuthorization(policy => policy.RequireRole(SystemRoles.Owner));

        group.MapGet("/", GetUserWorkshops)
            .WithName("GetUserWorkshops")
            .WithSummary("Get all workshops for the authenticated user.");

        group.MapGet("/{workshopId:guid}", GetWorkshopById)
            .WithName("GetWorkshopById")
            .WithSummary("Get workshop details by ID.");

        group.MapPut("/{workshopId:guid}", UpdateWorkshop)
            .WithName("UpdateWorkshop")
            .WithSummary("Update workshop details (Owner only).")
            .WithValidation<UpdateWorkshopRequest>();

        group.MapDelete("/{workshopId:guid}", DeleteWorkshop)
            .WithName("DeleteWorkshop")
            .WithSummary("Delete a workshop (Owner only).");

        group.MapGet("/{workshopId:guid}/members", GetWorkshopMembers)
            .WithName("GetWorkshopMembers")
            .WithSummary("Get all members of a workshop.");

        group.MapPost("/{workshopId:guid}/members/invite", InviteUserToWorkshop)
            .WithName("InviteUserToWorkshop")
            .WithSummary("Invite a user to join the workshop (Owner only).")
            .WithValidation<InviteUserRequest>();

        group.MapDelete("/{workshopId:guid}/members/{memberId:guid}", RemoveMember)
            .WithName("RemoveMember")
            .WithSummary("Remove a member from the workshop (Owner only).");

        group.MapPatch("/{workshopId:guid}/members/{memberId:guid}/role", UpdateMemberRole)
            .WithName("UpdateMemberRole")
            .WithSummary("Update a member's role in the workshop (Owner only).")
            .WithValidation<UpdateMemberRoleRequest>();

        return app;
    }

    private static async Task<IResult> CreateWorkshop(
        CreateWorkshopRequest request,
        HttpContext httpContext,
        IWorkshopService workshopService,
        CancellationToken cancellationToken)
    {
        var userId = httpContext.User.GetUserId();

        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var result = await workshopService.CreateWorkshopAsync(userId.Value, request, cancellationToken);

        if (result.IsSuccess)
        {
            return Results.Created($"/api/workshops/{result.Value!.Id}", result.Value);
        }

        return result.ToHttpResult();
    }

    private static async Task<IResult> GetUserWorkshops(
        HttpContext httpContext,
        IWorkshopService workshopService,
        CancellationToken cancellationToken)
    {
        var userId = httpContext.User.GetUserId();

        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var result = await workshopService.GetUserWorkshopsAsync(userId.Value, cancellationToken);
        return result.ToHttpResult();
    }

    private static async Task<IResult> GetWorkshopById(
        Guid workshopId,
        HttpContext httpContext,
        IWorkshopService workshopService,
        CancellationToken cancellationToken)
    {
        var userId = httpContext.User.GetUserId();

        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var result = await workshopService.GetWorkshopByIdAsync(workshopId, userId.Value, cancellationToken);
        return result.ToHttpResult();
    }

    private static async Task<IResult> UpdateWorkshop(
        Guid workshopId,
        UpdateWorkshopRequest request,
        HttpContext httpContext,
        IWorkshopService workshopService,
        CancellationToken cancellationToken)
    {
        var userId = httpContext.User.GetUserId();

        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var result = await workshopService.UpdateWorkshopAsync(workshopId, userId.Value, request, cancellationToken);
        return result.ToHttpResult();
    }

    private static async Task<IResult> DeleteWorkshop(
        Guid workshopId,
        HttpContext httpContext,
        IWorkshopService workshopService,
        CancellationToken cancellationToken)
    {
        var userId = httpContext.User.GetUserId();

        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var result = await workshopService.DeleteWorkshopAsync(workshopId, userId.Value, cancellationToken);

        if (result.IsSuccess)
        {
            return Results.NoContent();
        }

        return result.ToHttpResult();
    }

    private static async Task<IResult> GetWorkshopMembers(
        Guid workshopId,
        HttpContext httpContext,
        IWorkshopService workshopService,
        CancellationToken cancellationToken)
    {
        var userId = httpContext.User.GetUserId();

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
        HttpContext httpContext,
        IWorkshopService workshopService,
        CancellationToken cancellationToken)
    {
        var userId = httpContext.User.GetUserId();

        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var result = await workshopService.InviteUserToWorkshopAsync(workshopId, userId.Value, request, cancellationToken);

        if (result.IsSuccess)
        {
            return Results.Ok(new { message = "User invited successfully." });
        }

        return result.ToHttpResult();
    }

    private static async Task<IResult> RemoveMember(
        Guid workshopId,
        Guid memberId,
        HttpContext httpContext,
        IWorkshopService workshopService,
        CancellationToken cancellationToken)
    {
        var userId = httpContext.User.GetUserId();

        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var result = await workshopService.RemoveMemberAsync(workshopId, memberId, userId.Value, cancellationToken);

        if (result.IsSuccess)
        {
            return Results.NoContent();
        }

        return result.ToHttpResult();
    }

    private static async Task<IResult> UpdateMemberRole(
        Guid workshopId,
        Guid memberId,
        UpdateMemberRoleRequest request,
        HttpContext httpContext,
        IWorkshopService workshopService,
        CancellationToken cancellationToken)
    {
        var userId = httpContext.User.GetUserId();

        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var result = await workshopService.UpdateMemberRoleAsync(workshopId, memberId, request.Role, userId.Value, cancellationToken);

        if (result.IsSuccess)
        {
            return Results.Ok(new { message = "Member role updated successfully." });
        }

        return result.ToHttpResult();
    }
}
