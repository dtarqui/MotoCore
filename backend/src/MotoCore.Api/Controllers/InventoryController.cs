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
        var group = endpoints.MapGroup("/api/workshops/{workshopId:guid}/inventory")
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
        Guid workshopId,
        CreatePartRequest request,
        IInventoryService inventoryService,
        HttpContext httpContext)
    {
        var userId = httpContext.User.GetUserId();
        if (!userId.HasValue)
        {
            return Results.Unauthorized();
        }

        var result = await inventoryService.CreatePartAsync(workshopId, userId.Value, request);

        if (result.IsSuccess)
        {
            return Results.Created($"/api/workshops/{workshopId}/inventory/parts/{result.Value!.Id}", result.Value);
        }

        return result.ToHttpResult();
    }

    private static async Task<IResult> GetPartById(
        Guid workshopId,
        Guid partId,
        IInventoryService inventoryService,
        HttpContext httpContext)
    {
        var userId = httpContext.User.GetUserId();
        if (!userId.HasValue)
        {
            return Results.Unauthorized();
        }

        var result = await inventoryService.GetPartByIdAsync(workshopId, partId, userId.Value);
        return result.ToHttpResult();
    }

    private static async Task<IResult> GetWorkshopParts(
        Guid workshopId,
        IInventoryService inventoryService,
        HttpContext httpContext)
    {
        var userId = httpContext.User.GetUserId();
        if (!userId.HasValue)
        {
            return Results.Unauthorized();
        }

        var result = await inventoryService.GetWorkshopPartsAsync(workshopId, userId.Value);
        return result.ToHttpResult();
    }

    private static async Task<IResult> GetLowStockParts(
        Guid workshopId,
        IInventoryService inventoryService,
        HttpContext httpContext)
    {
        var userId = httpContext.User.GetUserId();
        if (!userId.HasValue)
        {
            return Results.Unauthorized();
        }

        var result = await inventoryService.GetLowStockPartsAsync(workshopId, userId.Value);
        return result.ToHttpResult();
    }

    private static async Task<IResult> UpdatePart(
        Guid workshopId,
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

        var result = await inventoryService.UpdatePartAsync(workshopId, partId, userId.Value, request);
        return result.ToHttpResult();
    }

    private static async Task<IResult> DeletePart(
        Guid workshopId,
        Guid partId,
        IInventoryService inventoryService,
        HttpContext httpContext)
    {
        var userId = httpContext.User.GetUserId();
        if (!userId.HasValue)
        {
            return Results.Unauthorized();
        }

        var result = await inventoryService.DeletePartAsync(workshopId, partId, userId.Value);
        return result.ToHttpResult();
    }

    private static async Task<IResult> CreatePartMovement(
        Guid workshopId,
        CreatePartMovementRequest request,
        IInventoryService inventoryService,
        HttpContext httpContext)
    {
        var userId = httpContext.User.GetUserId();
        if (!userId.HasValue)
        {
            return Results.Unauthorized();
        }

        var result = await inventoryService.CreatePartMovementAsync(workshopId, userId.Value, request);

        if (result.IsSuccess)
        {
            return Results.Created($"/api/workshops/{workshopId}/inventory/movements/{result.Value!.Id}", result.Value);
        }

        return result.ToHttpResult();
    }

    private static async Task<IResult> GetWorkshopMovements(
        Guid workshopId,
        IInventoryService inventoryService,
        HttpContext httpContext)
    {
        var userId = httpContext.User.GetUserId();
        if (!userId.HasValue)
        {
            return Results.Unauthorized();
        }

        var result = await inventoryService.GetWorkshopMovementsAsync(workshopId, userId.Value);
        return result.ToHttpResult();
    }
}
