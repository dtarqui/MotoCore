using MotoCore.Api.Extensions;
using MotoCore.Api.Filters;
using MotoCore.Application.Clients.Contracts;
using MotoCore.Application.Clients.Models;
using MotoCore.Domain.Auth;

namespace MotoCore.Api.Controllers;

public static class ClientController
{
    public static RouteGroupBuilder MapClientEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/clients")
            .WithTags("Clients")
            .RequireAuthorization();

        group.MapPost("/", CreateClient)
            .WithValidation<CreateClientRequest>()
            .RequireAuthorization(policy => policy.RequireRole(SystemRoles.Owner, SystemRoles.Receptionist));

        group.MapGet("/", GetWorkshopClients);

        group.MapGet("/{clientId:guid}", GetClientById);

        group.MapGet("/search", SearchClients);

        group.MapPut("/{clientId:guid}", UpdateClient)
            .WithValidation<UpdateClientRequest>()
            .RequireAuthorization(policy => policy.RequireRole(SystemRoles.Owner, SystemRoles.Receptionist));

        group.MapDelete("/{clientId:guid}", DeleteClient)
            .RequireAuthorization(policy => policy.RequireRole(SystemRoles.Owner, SystemRoles.Receptionist));

        group.MapGet("/{clientId:guid}/summary", GetClientSummary);

        group.MapGet("/statistics", GetClientStatistics);

        return group;
    }

    private static async Task<IResult> CreateClient(
        CreateClientRequest request,
        IClientService clientService,
        HttpContext httpContext)
    {
        var userId = httpContext.User.GetUserId();
        if (!userId.HasValue)
        {
            return Results.Unauthorized();
        }

        var workshopId = httpContext.User.GetFirstWorkshopId();
        if (!workshopId.HasValue)
        {
            return Results.BadRequest(new { error = "No workshop assigned to user" });
        }

        var result = await clientService.CreateClientAsync(workshopId.Value, userId.Value, request);

        if (result.IsSuccess)
        {
            return Results.Created($"/api/clients/{result.Value!.Id}", result.Value);
        }

        return result.ToHttpResult();
    }

    private static async Task<IResult> GetClientById(
        Guid clientId,
        IClientService clientService,
        HttpContext httpContext)
    {
        var userId = httpContext.User.GetUserId();
        if (!userId.HasValue)
        {
            return Results.Unauthorized();
        }

        var workshopId = httpContext.User.GetFirstWorkshopId();
        if (!workshopId.HasValue)
        {
            return Results.BadRequest(new { error = "No workshop assigned to user" });
        }

        var result = await clientService.GetClientByIdAsync(workshopId.Value, clientId, userId.Value);
        return result.ToHttpResult();
    }

    private static async Task<IResult> GetWorkshopClients(
        IClientService clientService,
        HttpContext httpContext,
        int? page = null,
        int? pageSize = null)
    {
        var userId = httpContext.User.GetUserId();
        if (!userId.HasValue)
        {
            return Results.Unauthorized();
        }

        var workshopId = httpContext.User.GetFirstWorkshopId();
        if (!workshopId.HasValue)
        {
            return Results.BadRequest(new { error = "No workshop assigned to user" });
        }

        if (page is null && pageSize is null)
        {
            var result = await clientService.GetWorkshopClientsAsync(workshopId.Value, userId.Value);
            return result.ToHttpResult();
        }

        var pagedResult = await clientService.GetWorkshopClientsPagedAsync(workshopId.Value, userId.Value, page ?? 1, pageSize ?? 20);
        if (!pagedResult.IsSuccess)
        {
            return pagedResult.Error!.ToProblemResult();
        }

        httpContext.Response.Headers["X-Total-Count"] = pagedResult.Value!.TotalCount.ToString();
        httpContext.Response.Headers["X-Page"] = pagedResult.Value.Page.ToString();
        httpContext.Response.Headers["X-Page-Size"] = pagedResult.Value.PageSize.ToString();

        return Results.Ok(pagedResult.Value.Items);
    }

    private static async Task<IResult> SearchClients(
        string query,
        IClientService clientService,
        HttpContext httpContext)
    {
        var userId = httpContext.User.GetUserId();
        if (!userId.HasValue)
        {
            return Results.Unauthorized();
        }

        var workshopId = httpContext.User.GetFirstWorkshopId();
        if (!workshopId.HasValue)
        {
            return Results.BadRequest(new { error = "No workshop assigned to user" });
        }

        var result = await clientService.SearchClientsAsync(workshopId.Value, query, userId.Value);
        return result.ToHttpResult();
    }

    private static async Task<IResult> UpdateClient(
        Guid clientId,
        UpdateClientRequest request,
        IClientService clientService,
        HttpContext httpContext)
    {
        var userId = httpContext.User.GetUserId();
        if (!userId.HasValue)
        {
            return Results.Unauthorized();
        }

        var workshopId = httpContext.User.GetFirstWorkshopId();
        if (!workshopId.HasValue)
        {
            return Results.BadRequest(new { error = "No workshop assigned to user" });
        }

        var result = await clientService.UpdateClientAsync(workshopId.Value, clientId, userId.Value, request);
        return result.ToHttpResult();
    }

    private static async Task<IResult> DeleteClient(
        Guid clientId,
        IClientService clientService,
        HttpContext httpContext)
    {
        var userId = httpContext.User.GetUserId();
        if (!userId.HasValue)
        {
            return Results.Unauthorized();
        }

        var workshopId = httpContext.User.GetFirstWorkshopId();
        if (!workshopId.HasValue)
        {
            return Results.BadRequest(new { error = "No workshop assigned to user" });
        }

        var result = await clientService.DeleteClientAsync(workshopId.Value, clientId, userId.Value);
        return result.ToHttpResult();
    }

    private static async Task<IResult> GetClientSummary(
        Guid clientId,
        IClientService clientService,
        HttpContext httpContext)
    {
        var userId = httpContext.User.GetUserId();
        if (!userId.HasValue)
        {
            return Results.Unauthorized();
        }

        var workshopId = httpContext.User.GetFirstWorkshopId();
        if (!workshopId.HasValue)
        {
            return Results.BadRequest(new { error = "No workshop assigned to user" });
        }

        var result = await clientService.GetClientSummaryAsync(workshopId.Value, clientId, userId.Value);
        return result.ToHttpResult();
    }

    private static async Task<IResult> GetClientStatistics(
        IClientService clientService,
        HttpContext httpContext)
    {
        var userId = httpContext.User.GetUserId();
        if (!userId.HasValue)
        {
            return Results.Unauthorized();
        }

        var workshopId = httpContext.User.GetFirstWorkshopId();
        if (!workshopId.HasValue)
        {
            return Results.BadRequest(new { error = "No workshop assigned to user" });
        }

        var result = await clientService.GetClientStatisticsAsync(workshopId.Value, userId.Value);
        return result.ToHttpResult();
    }
}
