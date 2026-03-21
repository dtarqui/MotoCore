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
        var group = endpoints.MapGroup("/clients")
            .WithTags("Clients")
            .RequireAuthorization();

        group.MapPost("/", CreateClient)
            .WithValidation<CreateClientRequest>()
            .RequireAuthorization(policy => policy.RequireRole(SystemRoles.Owner, SystemRoles.Receptionist));

        group.MapGet("/{clientId:guid}", GetClientById);

        group.MapGet("/workshop/{workshopId:guid}", GetWorkshopClients);

        group.MapGet("/workshop/{workshopId:guid}/search", SearchClients);

        group.MapPut("/{clientId:guid}", UpdateClient)
            .WithValidation<UpdateClientRequest>()
            .RequireAuthorization(policy => policy.RequireRole(SystemRoles.Owner, SystemRoles.Receptionist));

        group.MapDelete("/{clientId:guid}", DeleteClient)
            .RequireAuthorization(policy => policy.RequireRole(SystemRoles.Owner, SystemRoles.Receptionist));

        group.MapGet("/{clientId:guid}/summary", GetClientSummary);

        group.MapGet("/workshop/{workshopId:guid}/statistics", GetClientStatistics);

        return group;
    }

    private static async Task<IResult> CreateClient(
        Guid workshopId,
        CreateClientRequest request,
        IClientService clientService,
        HttpContext httpContext)
    {
        var userId = httpContext.User.GetUserId();
        if (!userId.HasValue)
        {
            return Results.Unauthorized();
        }

        var result = await clientService.CreateClientAsync(workshopId, userId.Value, request);

        if (result.IsSuccess)
        {
            return Results.Created($"/clients/{result.Value!.Id}", result.Value);
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

        var result = await clientService.GetClientByIdAsync(clientId, userId.Value);
        return result.ToHttpResult();
    }

    private static async Task<IResult> GetWorkshopClients(
        Guid workshopId,
        IClientService clientService,
        HttpContext httpContext)
    {
        var userId = httpContext.User.GetUserId();
        if (!userId.HasValue)
        {
            return Results.Unauthorized();
        }

        var result = await clientService.GetWorkshopClientsAsync(workshopId, userId.Value);
        return result.ToHttpResult();
    }

    private static async Task<IResult> SearchClients(
        Guid workshopId,
        string query,
        IClientService clientService,
        HttpContext httpContext)
    {
        var userId = httpContext.User.GetUserId();
        if (!userId.HasValue)
        {
            return Results.Unauthorized();
        }

        var result = await clientService.SearchClientsAsync(workshopId, query, userId.Value);
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

        var result = await clientService.UpdateClientAsync(clientId, userId.Value, request);
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

        var result = await clientService.DeleteClientAsync(clientId, userId.Value);
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

        var result = await clientService.GetClientSummaryAsync(clientId, userId.Value);
        return result.ToHttpResult();
    }

    private static async Task<IResult> GetClientStatistics(
        Guid workshopId,
        IClientService clientService,
        HttpContext httpContext)
    {
        var userId = httpContext.User.GetUserId();
        if (!userId.HasValue)
        {
            return Results.Unauthorized();
        }

        var result = await clientService.GetClientStatisticsAsync(workshopId, userId.Value);
        return result.ToHttpResult();
    }
}
