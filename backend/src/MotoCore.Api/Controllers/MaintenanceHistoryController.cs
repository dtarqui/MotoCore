using MotoCore.Api.Extensions;
using MotoCore.Api.Filters;
using MotoCore.Application.MaintenanceHistory.Contracts;
using MotoCore.Application.MaintenanceHistory.Models;

namespace MotoCore.Api.Controllers;

public static class MaintenanceHistoryController
{
    public static RouteGroupBuilder MapMaintenanceHistoryEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/maintenance-history")
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
        CreateMaintenanceHistoryEntryRequest request,
        IMaintenanceHistoryService maintenanceHistoryService,
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

        var result = await maintenanceHistoryService.CreateMaintenanceHistoryEntryAsync(workshopId.Value, userId.Value, request);

        if (result.IsSuccess)
        {
            return Results.Created($"/api/maintenance-history/{result.Value!.Id}", result.Value);
        }

        return result.ToHttpResult();
    }

    private static async Task<IResult> GetMaintenanceHistoryEntryById(
        Guid entryId,
        IMaintenanceHistoryService maintenanceHistoryService,
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

        var result = await maintenanceHistoryService.GetMaintenanceHistoryEntryByIdAsync(workshopId.Value, entryId, userId.Value);
        return result.ToHttpResult();
    }

    private static async Task<IResult> GetMotorcycleMaintenanceHistory(
        Guid motorcycleId,
        IMaintenanceHistoryService maintenanceHistoryService,
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

        var result = await maintenanceHistoryService.GetMotorcycleMaintenanceHistoryAsync(workshopId.Value, motorcycleId, userId.Value);
        return result.ToHttpResult();
    }

    private static async Task<IResult> GetClientMaintenanceHistory(
        Guid clientId,
        IMaintenanceHistoryService maintenanceHistoryService,
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

        var result = await maintenanceHistoryService.GetClientMaintenanceHistoryAsync(workshopId.Value, clientId, userId.Value);
        return result.ToHttpResult();
    }

    // TODO: Implementar cuando se defina el sistema de almacenamiento (S3 u otro)
    // private static async Task<IResult> UploadMaintenancePhoto(...)
    // {
    //     // Implementación futura con S3 o servicio similar
    // }
}
