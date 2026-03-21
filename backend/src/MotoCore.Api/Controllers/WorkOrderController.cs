using MotoCore.Api.Extensions;
using MotoCore.Api.Filters;
using MotoCore.Application.WorkOrders.Contracts;
using MotoCore.Application.WorkOrders.Models;
using MotoCore.Domain.Auth;

namespace MotoCore.Api.Controllers;

public static class WorkOrderController
{
    public static RouteGroupBuilder MapWorkOrderEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/workshops/{workshopId:guid}/work-orders")
            .WithTags("Work Orders")
            .RequireAuthorization();

        group.MapPost("/", CreateWorkOrder)
            .WithValidation<CreateWorkOrderRequest>()
            .RequireAuthorization(policy => policy.RequireRole(SystemRoles.Owner, SystemRoles.Receptionist));

        group.MapGet("/", GetWorkshopWorkOrders);

        group.MapGet("/{workOrderId:guid}", GetWorkOrderById);

        group.MapGet("/by-motorcycle/{motorcycleId:guid}", GetMotorcycleWorkOrders);

        group.MapPatch("/{workOrderId:guid}/status", UpdateWorkOrderStatus)
            .WithValidation<UpdateWorkOrderStatusRequest>()
            .RequireAuthorization(policy => policy.RequireRole(SystemRoles.Owner, SystemRoles.Mechanic));

        group.MapPatch("/{workOrderId:guid}/diagnosis", UpdateWorkOrderDiagnosis)
            .WithValidation<UpdateWorkOrderDiagnosisRequest>()
            .RequireAuthorization(policy => policy.RequireRole(SystemRoles.Owner, SystemRoles.Mechanic));

        group.MapPatch("/{workOrderId:guid}/close", CloseWorkOrder)
            .WithValidation<CloseWorkOrderRequest>()
            .RequireAuthorization(policy => policy.RequireRole(SystemRoles.Owner, SystemRoles.Mechanic));

        group.MapPatch("/{workOrderId:guid}/deliver", DeliverWorkOrder)
            .RequireAuthorization(policy => policy.RequireRole(SystemRoles.Owner, SystemRoles.Receptionist));

        return group;
    }

    private static async Task<IResult> CreateWorkOrder(
        Guid workshopId,
        CreateWorkOrderRequest request,
        IWorkOrderService workOrderService,
        HttpContext httpContext)
    {
        var userId = httpContext.User.GetUserId();
        if (!userId.HasValue)
        {
            return Results.Unauthorized();
        }

        var result = await workOrderService.CreateWorkOrderAsync(workshopId, userId.Value, request);

        if (result.IsSuccess)
        {
            return Results.Created($"/api/workshops/{workshopId}/work-orders/{result.Value!.Id}", result.Value);
        }

        return result.ToHttpResult();
    }

    private static async Task<IResult> GetWorkOrderById(
        Guid workshopId,
        Guid workOrderId,
        IWorkOrderService workOrderService,
        HttpContext httpContext)
    {
        var userId = httpContext.User.GetUserId();
        if (!userId.HasValue)
        {
            return Results.Unauthorized();
        }

        var result = await workOrderService.GetWorkOrderByIdAsync(workshopId, workOrderId, userId.Value);
        return result.ToHttpResult();
    }

    private static async Task<IResult> GetWorkshopWorkOrders(
        Guid workshopId,
        IWorkOrderService workOrderService,
        HttpContext httpContext)
    {
        var userId = httpContext.User.GetUserId();
        if (!userId.HasValue)
        {
            return Results.Unauthorized();
        }

        var result = await workOrderService.GetWorkshopWorkOrdersAsync(workshopId, userId.Value);
        return result.ToHttpResult();
    }

    private static async Task<IResult> GetMotorcycleWorkOrders(
        Guid workshopId,
        Guid motorcycleId,
        IWorkOrderService workOrderService,
        HttpContext httpContext)
    {
        var userId = httpContext.User.GetUserId();
        if (!userId.HasValue)
        {
            return Results.Unauthorized();
        }

        var result = await workOrderService.GetMotorcycleWorkOrdersAsync(workshopId, motorcycleId, userId.Value);
        return result.ToHttpResult();
    }

    private static async Task<IResult> UpdateWorkOrderStatus(
        Guid workshopId,
        Guid workOrderId,
        UpdateWorkOrderStatusRequest request,
        IWorkOrderService workOrderService,
        HttpContext httpContext)
    {
        var userId = httpContext.User.GetUserId();
        if (!userId.HasValue)
        {
            return Results.Unauthorized();
        }

        var result = await workOrderService.UpdateWorkOrderStatusAsync(workshopId, workOrderId, userId.Value, request);
        return result.ToHttpResult();
    }

    private static async Task<IResult> UpdateWorkOrderDiagnosis(
        Guid workshopId,
        Guid workOrderId,
        UpdateWorkOrderDiagnosisRequest request,
        IWorkOrderService workOrderService,
        HttpContext httpContext)
    {
        var userId = httpContext.User.GetUserId();
        if (!userId.HasValue)
        {
            return Results.Unauthorized();
        }

        var result = await workOrderService.UpdateWorkOrderDiagnosisAsync(workshopId, workOrderId, userId.Value, request);
        return result.ToHttpResult();
    }

    private static async Task<IResult> CloseWorkOrder(
        Guid workshopId,
        Guid workOrderId,
        CloseWorkOrderRequest request,
        IWorkOrderService workOrderService,
        HttpContext httpContext)
    {
        var userId = httpContext.User.GetUserId();
        if (!userId.HasValue)
        {
            return Results.Unauthorized();
        }

        var result = await workOrderService.CloseWorkOrderAsync(workshopId, workOrderId, userId.Value, request);
        return result.ToHttpResult();
    }

    private static async Task<IResult> DeliverWorkOrder(
        Guid workshopId,
        Guid workOrderId,
        IWorkOrderService workOrderService,
        HttpContext httpContext)
    {
        var userId = httpContext.User.GetUserId();
        if (!userId.HasValue)
        {
            return Results.Unauthorized();
        }

        var result = await workOrderService.DeliverWorkOrderAsync(workshopId, workOrderId, userId.Value);
        return result.ToHttpResult();
    }
}
