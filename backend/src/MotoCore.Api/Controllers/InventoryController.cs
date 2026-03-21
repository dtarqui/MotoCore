using MotoCore.Api.Extensions;
using MotoCore.Api.Filters;
using MotoCore.Application.Inventory.Contracts;
using MotoCore.Application.Inventory.Models;
using MotoCore.Domain.Auth;

namespace MotoCore.Api.Controllers;

public static class InventoryController
{
    public static RouteGroupBuilder MapInventoryEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/inventory")
            .WithTags("Inventory")
            .RequireAuthorization();

        group.MapPost("/parts", CreatePart)
            .WithValidation<CreatePartRequest>()
            .RequireAuthorization(policy => policy.RequireRole(SystemRoles.Owner, SystemRoles.Receptionist));

        group.MapGet("/parts", GetWorkshopParts);

        group.MapGet("/parts/{partId:guid}", GetPartById);

        group.MapGet("/low-stock", GetLowStockParts)
            .RequireAuthorization(policy => policy.RequireRole(SystemRoles.Owner, SystemRoles.Receptionist));

        group.MapPut("/parts/{partId:guid}", UpdatePart)
            .WithValidation<UpdatePartRequest>()
            .RequireAuthorization(policy => policy.RequireRole(SystemRoles.Owner, SystemRoles.Receptionist));

        group.MapDelete("/parts/{partId:guid}", DeletePart)
            .RequireAuthorization(policy => policy.RequireRole(SystemRoles.Owner));

        group.MapPost("/movements", CreatePartMovement)
            .WithValidation<CreatePartMovementRequest>();

        group.MapGet("/movements", GetWorkshopMovements)
            .RequireAuthorization(policy => policy.RequireRole(SystemRoles.Owner, SystemRoles.Receptionist));

        return group;
    }

    private static async Task<IResult> CreatePart(
        CreatePartRequest request,
        IInventoryService inventoryService,
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

        var result = await inventoryService.CreatePartAsync(workshopId.Value, userId.Value, request);

        if (result.IsSuccess)
        {
            return Results.Created($"/api/inventory/parts/{result.Value!.Id}", result.Value);
        }

        return result.ToHttpResult();
    }

    private static async Task<IResult> GetPartById(
        Guid partId,
        IInventoryService inventoryService,
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

        var result = await inventoryService.GetPartByIdAsync(workshopId.Value, partId, userId.Value);
        return result.ToHttpResult();
    }

    private static async Task<IResult> GetWorkshopParts(
        IInventoryService inventoryService,
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

        var result = await inventoryService.GetWorkshopPartsAsync(workshopId.Value, userId.Value);
        return result.ToHttpResult();
    }

    private static async Task<IResult> GetLowStockParts(
        IInventoryService inventoryService,
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

        var result = await inventoryService.GetLowStockPartsAsync(workshopId.Value, userId.Value);
        return result.ToHttpResult();
    }

    private static async Task<IResult> UpdatePart(
        Guid partId,
        UpdatePartRequest request,
        IInventoryService inventoryService,
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

        var result = await inventoryService.UpdatePartAsync(workshopId.Value, partId, userId.Value, request);
        return result.ToHttpResult();
    }

    private static async Task<IResult> DeletePart(
        Guid partId,
        IInventoryService inventoryService,
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

        var result = await inventoryService.DeletePartAsync(workshopId.Value, partId, userId.Value);
        return result.ToHttpResult();
    }

    private static async Task<IResult> CreatePartMovement(
        CreatePartMovementRequest request,
        IInventoryService inventoryService,
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

        var result = await inventoryService.CreatePartMovementAsync(workshopId.Value, userId.Value, request);

        if (result.IsSuccess)
        {
            return Results.Created($"/api/inventory/movements/{result.Value!.Id}", result.Value);
        }

        return result.ToHttpResult();
    }

    private static async Task<IResult> GetWorkshopMovements(
        IInventoryService inventoryService,
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

        var result = await inventoryService.GetWorkshopMovementsAsync(workshopId.Value, userId.Value);
        return result.ToHttpResult();
    }
}
