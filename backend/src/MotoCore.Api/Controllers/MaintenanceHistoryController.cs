using MotoCore.Api.Extensions;
using MotoCore.Api.Filters;
using MotoCore.Application.MaintenanceHistory.Contracts;
using MotoCore.Application.MaintenanceHistory.Models;

namespace MotoCore.Api.Controllers;

public static class MaintenanceHistoryController
{
    public static RouteGroupBuilder MapMaintenanceHistoryEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/workshops/{workshopId:guid}/maintenance-history")
            .WithTags("Maintenance History")
            .RequireAuthorization();

        group.MapPost("/", CreateMaintenanceHistoryEntry)
            .WithValidation<CreateMaintenanceHistoryEntryRequest>();

        group.MapGet("/{entryId:guid}", GetMaintenanceHistoryEntryById);

        group.MapGet("/motorcycles/{motorcycleId:guid}", GetMotorcycleMaintenanceHistory);

        group.MapGet("/clients/{clientId:guid}", GetClientMaintenanceHistory);

        // TODO: Implementar cuando se defina el sistema de almacenamiento (S3 u otro)
        // group.MapPost("/{entryId:guid}/photos", UploadMaintenancePhoto)
        //     .RequireAuthorization(policy => policy.RequireRole(SystemRoles.Owner, SystemRoles.Mechanic));

        return group;
    }

    private static async Task<IResult> CreateMaintenanceHistoryEntry(
        Guid workshopId,
        CreateMaintenanceHistoryEntryRequest request,
        IMaintenanceHistoryService maintenanceHistoryService,
        HttpContext httpContext)
    {
        var userId = httpContext.User.GetUserId();
        if (!userId.HasValue)
        {
            return Results.Unauthorized();
        }

        var result = await maintenanceHistoryService.CreateMaintenanceHistoryEntryAsync(workshopId, userId.Value, request);

        if (result.IsSuccess)
        {
            return Results.Created($"/api/workshops/{workshopId}/maintenance-history/{result.Value!.Id}", result.Value);
        }

        return result.ToHttpResult();
    }

    private static async Task<IResult> GetMaintenanceHistoryEntryById(
        Guid workshopId,
        Guid entryId,
        IMaintenanceHistoryService maintenanceHistoryService,
        HttpContext httpContext)
    {
        var userId = httpContext.User.GetUserId();
        if (!userId.HasValue)
        {
            return Results.Unauthorized();
        }

        var result = await maintenanceHistoryService.GetMaintenanceHistoryEntryByIdAsync(workshopId, entryId, userId.Value);
        return result.ToHttpResult();
    }

    private static async Task<IResult> GetMotorcycleMaintenanceHistory(
        Guid workshopId,
        Guid motorcycleId,
        IMaintenanceHistoryService maintenanceHistoryService,
        HttpContext httpContext)
    {
        var userId = httpContext.User.GetUserId();
        if (!userId.HasValue)
        {
            return Results.Unauthorized();
        }

        var result = await maintenanceHistoryService.GetMotorcycleMaintenanceHistoryAsync(workshopId, motorcycleId, userId.Value);
        return result.ToHttpResult();
    }

    private static async Task<IResult> GetClientMaintenanceHistory(
        Guid workshopId,
        Guid clientId,
        IMaintenanceHistoryService maintenanceHistoryService,
        HttpContext httpContext)
    {
        var userId = httpContext.User.GetUserId();
        if (!userId.HasValue)
        {
            return Results.Unauthorized();
        }

        var result = await maintenanceHistoryService.GetClientMaintenanceHistoryAsync(workshopId, clientId, userId.Value);
        return result.ToHttpResult();
    }

    // TODO: Implementar cuando se defina el sistema de almacenamiento (S3 u otro)
    // private static async Task<IResult> UploadMaintenancePhoto(...)
    // {
    //     // Implementación futura con S3 o servicio similar
    // }
}
