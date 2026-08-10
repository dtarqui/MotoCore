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
        var group = endpoints.MapGroup("/api/motorcycles")
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
        CreateMotorcycleRequest request,
        IMotorcycleService motorcycleService,
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

        var result = await motorcycleService.CreateMotorcycleAsync(workshopId.Value, userId.Value, request);

        if (result.IsSuccess)
        {
            return Results.Created($"/api/motorcycles/{result.Value!.Id}", result.Value);
        }

        return result.ToHttpResult();
    }

    private static async Task<IResult> GetMotorcycleById(
        Guid motorcycleId,
        IMotorcycleService motorcycleService,
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

        var result = await motorcycleService.GetMotorcycleByIdAsync(workshopId.Value, motorcycleId, userId.Value);
        return result.ToHttpResult();
    }

    private static async Task<IResult> GetWorkshopMotorcycles(
        IMotorcycleService motorcycleService,
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
            var result = await motorcycleService.GetWorkshopMotorcyclesAsync(workshopId.Value, userId.Value);
            return result.ToHttpResult();
        }

        var pagedResult = await motorcycleService.GetWorkshopMotorcyclesPagedAsync(workshopId.Value, userId.Value, page ?? 1, pageSize ?? 20);
        if (!pagedResult.IsSuccess)
        {
            return pagedResult.Error!.ToProblemResult();
        }

        httpContext.Response.Headers["X-Total-Count"] = pagedResult.Value!.TotalCount.ToString();
        httpContext.Response.Headers["X-Page"] = pagedResult.Value.Page.ToString();
        httpContext.Response.Headers["X-Page-Size"] = pagedResult.Value.PageSize.ToString();

        return Results.Ok(pagedResult.Value.Items);
    }

    private static async Task<IResult> GetClientMotorcycles(
        Guid clientId,
        IMotorcycleService motorcycleService,
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

        var result = await motorcycleService.GetClientMotorcyclesAsync(workshopId.Value, clientId, userId.Value);
        return result.ToHttpResult();
    }

    private static async Task<IResult> UpdateMotorcycle(
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

        var workshopId = httpContext.User.GetFirstWorkshopId();
        if (!workshopId.HasValue)
        {
            return Results.BadRequest(new { error = "No workshop assigned to user" });
        }

        var result = await motorcycleService.UpdateMotorcycleAsync(workshopId.Value, motorcycleId, userId.Value, request);
        return result.ToHttpResult();
    }

    private static async Task<IResult> DeleteMotorcycle(
        Guid motorcycleId,
        IMotorcycleService motorcycleService,
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

        var result = await motorcycleService.DeleteMotorcycleAsync(workshopId.Value, motorcycleId, userId.Value);
        return result.ToHttpResult();
    }
}
