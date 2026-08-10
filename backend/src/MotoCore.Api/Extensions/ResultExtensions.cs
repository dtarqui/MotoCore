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
        // Authentication errors
        "auth.invalid_credentials" => StatusCodes.Status401Unauthorized,
        "auth.invalid_refresh_token" => StatusCodes.Status401Unauthorized,
        "auth.email_in_use" => StatusCodes.Status409Conflict,
        "auth.invalid_email" => StatusCodes.Status400BadRequest,
        "auth.invalid_password" => StatusCodes.Status400BadRequest,
        "auth.invalid_role" => StatusCodes.Status400BadRequest,

        // User errors
        "user.not_found" => StatusCodes.Status404NotFound,
        "user.invalid_role" => StatusCodes.Status400BadRequest,

        // Default
        _ => StatusCodes.Status400BadRequest,
    };
}
