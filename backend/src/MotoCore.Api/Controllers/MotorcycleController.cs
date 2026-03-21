using MotoCore.Api.Extensions;
using MotoCore.Api.Filters;
using MotoCore.Application.Motorcycles.Contracts;
using MotoCore.Application.Motorcycles.Models;
using MotoCore.Domain.Auth;

namespace MotoCore.Api.Controllers;

public static class MotorcycleController
{
    public static RouteGroupBuilder MapMotorcycleEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/workshops/{workshopId:guid}/motorcycles")
            .WithTags("Motorcycles")
            .RequireAuthorization();

        group.MapPost("/", CreateMotorcycle)
            .WithValidation<CreateMotorcycleRequest>()
            .RequireAuthorization(policy => policy.RequireRole(SystemRoles.Owner, SystemRoles.Receptionist));

        group.MapGet("/", GetWorkshopMotorcycles);

        group.MapGet("/{motorcycleId:guid}", GetMotorcycleById);

        group.MapGet("/by-client/{clientId:guid}", GetClientMotorcycles);

        group.MapPut("/{motorcycleId:guid}", UpdateMotorcycle)
            .WithValidation<UpdateMotorcycleRequest>()
            .RequireAuthorization(policy => policy.RequireRole(SystemRoles.Owner, SystemRoles.Receptionist));

        group.MapDelete("/{motorcycleId:guid}", DeleteMotorcycle)
            .RequireAuthorization(policy => policy.RequireRole(SystemRoles.Owner));

        return group;
    }

    private static async Task<IResult> CreateMotorcycle(
        Guid workshopId,
        CreateMotorcycleRequest request,
        IMotorcycleService motorcycleService,
        HttpContext httpContext)
    {
        var userId = httpContext.User.GetUserId();
        if (!userId.HasValue)
        {
            return Results.Unauthorized();
        }

        var result = await motorcycleService.CreateMotorcycleAsync(workshopId, userId.Value, request);

        if (result.IsSuccess)
        {
            return Results.Created($"/api/workshops/{workshopId}/motorcycles/{result.Value!.Id}", result.Value);
        }

        return result.ToHttpResult();
    }

    private static async Task<IResult> GetMotorcycleById(
        Guid workshopId,
        Guid motorcycleId,
        IMotorcycleService motorcycleService,
        HttpContext httpContext)
    {
        var userId = httpContext.User.GetUserId();
        if (!userId.HasValue)
        {
            return Results.Unauthorized();
        }

        var result = await motorcycleService.GetMotorcycleByIdAsync(workshopId, motorcycleId, userId.Value);
        return result.ToHttpResult();
    }

    private static async Task<IResult> GetWorkshopMotorcycles(
        Guid workshopId,
        IMotorcycleService motorcycleService,
        HttpContext httpContext)
    {
        var userId = httpContext.User.GetUserId();
        if (!userId.HasValue)
        {
            return Results.Unauthorized();
        }

        var result = await motorcycleService.GetWorkshopMotorcyclesAsync(workshopId, userId.Value);
        return result.ToHttpResult();
    }

    private static async Task<IResult> GetClientMotorcycles(
        Guid workshopId,
        Guid clientId,
        IMotorcycleService motorcycleService,
        HttpContext httpContext)
    {
        var userId = httpContext.User.GetUserId();
        if (!userId.HasValue)
        {
            return Results.Unauthorized();
        }

        var result = await motorcycleService.GetClientMotorcyclesAsync(workshopId, clientId, userId.Value);
        return result.ToHttpResult();
    }

    private static async Task<IResult> UpdateMotorcycle(
        Guid workshopId,
        Guid motorcycleId,
        UpdateMotorcycleRequest request,
        IMotorcycleService motorcycleService,
        HttpContext httpContext)
    {
        var userId = httpContext.User.GetUserId();
        if (!userId.HasValue)
        {
            return Results.Unauthorized();
        }

        var result = await motorcycleService.UpdateMotorcycleAsync(workshopId, motorcycleId, userId.Value, request);
        return result.ToHttpResult();
    }

    private static async Task<IResult> DeleteMotorcycle(
        Guid workshopId,
        Guid motorcycleId,
        IMotorcycleService motorcycleService,
        HttpContext httpContext)
    {
        var userId = httpContext.User.GetUserId();
        if (!userId.HasValue)
        {
            return Results.Unauthorized();
        }

        var result = await motorcycleService.DeleteMotorcycleAsync(workshopId, motorcycleId, userId.Value);
        return result.ToHttpResult();
    }
}
