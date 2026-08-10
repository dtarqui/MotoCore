using MotoCore.Application.Common.Results;

namespace MotoCore.Api.Extensions;

public static class ResultExtensions
{
    public static IResult ToHttpResult<T>(this Result<T> result)
    {
        if (result.IsSuccess)
        {
            return Results.Ok(result.Value);
        }

        return result.Error!.ToProblemResult();
    }

    public static IResult ToHttpResult(this Result result)
    {
        if (result.IsSuccess)
        {
            return Results.NoContent();
        }

        return result.Error!.ToProblemResult();
    }

    public static IResult ToProblemResult(this Error error)
    {
        var statusCode = GetStatusCode(error.Code);
        return Results.Problem(
            statusCode: statusCode,
            title: error.Code,
            detail: error.Message,
            type: $"https://httpstatuses.com/{statusCode}"
        );
    }

    private static int GetStatusCode(string errorCode) => errorCode switch
    {
        // Explicit overrides where the generic suffix rules below would pick the wrong code
        "auth.invalid_credentials" => StatusCodes.Status401Unauthorized,
        "auth.invalid_refresh_token" => StatusCodes.Status401Unauthorized,
        "auth.email_in_use" => StatusCodes.Status409Conflict,

        // Generic suffix rules — every module's error codes follow "<module>.<reason>"
        // naming, so matching on the reason suffix covers Clients/Motorcycles/WorkOrders/
        // Inventory/Workshops/MaintenanceHistory/Audit without enumerating every one by hand.
        _ when errorCode.EndsWith("not_found", StringComparison.Ordinal) => StatusCodes.Status404NotFound,
        _ when errorCode.EndsWith("access_denied", StringComparison.Ordinal) => StatusCodes.Status403Forbidden,
        _ when errorCode.EndsWith("insufficient_permissions", StringComparison.Ordinal) => StatusCodes.Status403Forbidden,
        _ when errorCode.EndsWith("cannot_remove_owner", StringComparison.Ordinal) => StatusCodes.Status403Forbidden,
        _ when errorCode.EndsWith("cannot_change_owner_role", StringComparison.Ordinal) => StatusCodes.Status403Forbidden,
        _ when errorCode.EndsWith("already_exists", StringComparison.Ordinal) => StatusCodes.Status409Conflict,
        _ when errorCode.EndsWith("already_member", StringComparison.Ordinal) => StatusCodes.Status409Conflict,
        _ when errorCode.EndsWith("already_closed", StringComparison.Ordinal) => StatusCodes.Status409Conflict,
        _ when errorCode.EndsWith("already_confirmed", StringComparison.Ordinal) => StatusCodes.Status409Conflict,
        _ when errorCode.EndsWith("insufficient_stock", StringComparison.Ordinal) => StatusCodes.Status409Conflict,

        // Default: validation-style / business-rule errors (invalid_*, *_mismatch, etc.)
        _ => StatusCodes.Status400BadRequest,
    };
}
