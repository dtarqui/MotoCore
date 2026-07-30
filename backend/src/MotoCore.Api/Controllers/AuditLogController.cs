using MotoCore.Api.Extensions;
using MotoCore.Application.Audit.Contracts;
using MotoCore.Domain.Auth;

namespace MotoCore.Api.Controllers;

public static class AuditLogController
{
    public static IEndpointRouteBuilder MapAuditLogEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/audit-logs")
            .WithTags("Audit Log")
            .RequireAuthorization(policy => policy.RequireRole(SystemRoles.Owner));

        group.MapGet("/", GetWorkshopAuditLog)
            .WithName("GetWorkshopAuditLog")
            .WithSummary("Get the audit log for the authenticated user's workshop (Owner only).");

        return app;
    }

    private static async Task<IResult> GetWorkshopAuditLog(
        HttpContext httpContext,
        IAuditLogService auditLogService,
        CancellationToken cancellationToken)
    {
        var userId = httpContext.User.GetUserId();
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var workshopId = httpContext.User.GetFirstWorkshopId();
        if (workshopId is null)
        {
            return Results.BadRequest(new { error = "No workshop assigned to user" });
        }

        var result = await auditLogService.GetWorkshopAuditLogAsync(workshopId.Value, userId.Value, cancellationToken);
        return result.ToHttpResult();
    }
}
