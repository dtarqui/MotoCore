using MotoCore.Application.Auth.Contracts;
using MotoCore.Application.Auth.Models;
using MotoCore.Application.Common.Results;

namespace MotoCore.Api.Endpoints;

public static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/auth")
            .WithTags("Authentication");

        group.MapGet("/external/providers", GetExternalProviders)
            .WithName("GetExternalAuthProviders")
            .WithSummary("List available external authentication providers.");

        group.MapPost("/register", Register)
            .WithName("RegisterAccount")
            .WithSummary("Create a local account and issue access/refresh tokens.");

        group.MapPost("/login", Login)
            .WithName("Login")
            .WithSummary("Authenticate a user with email and password.");

        group.MapPost("/refresh-token", RefreshToken)
            .WithName("RefreshToken")
            .WithSummary("Rotate the refresh token and issue a new access token.");

        group.MapPost("/logout", Logout)
            .WithName("Logout")
            .WithSummary("Revoke the current refresh token session.");

        return app;
    }

    private static async Task<IResult> GetExternalProviders(IAuthService authService, CancellationToken cancellationToken)
    {
        var result = await authService.GetExternalProvidersAsync(cancellationToken);
        return ToHttpResult(result);
    }

    private static async Task<IResult> Register(RegisterAccountRequest request, HttpContext httpContext, IAuthService authService, CancellationToken cancellationToken)
    {
        var result = await authService.RegisterAsync(request, GetIpAddress(httpContext), cancellationToken);

        if (result.IsSuccess)
        {
            return Results.Created("/api/auth/login", result.Value);
        }

        return ToHttpResult(result);
    }

    private static async Task<IResult> Login(LoginRequest request, HttpContext httpContext, IAuthService authService, CancellationToken cancellationToken)
    {
        var result = await authService.LoginAsync(request, GetIpAddress(httpContext), cancellationToken);
        return ToHttpResult(result);
    }

    private static async Task<IResult> RefreshToken(RefreshTokenRequest request, HttpContext httpContext, IAuthService authService, CancellationToken cancellationToken)
    {
        var result = await authService.RefreshTokenAsync(request, GetIpAddress(httpContext), cancellationToken);
        return ToHttpResult(result);
    }

    private static async Task<IResult> Logout(LogoutRequest request, HttpContext httpContext, IAuthService authService, CancellationToken cancellationToken)
    {
        var result = await authService.LogoutAsync(request, GetIpAddress(httpContext), cancellationToken);

        if (result.IsSuccess)
        {
            return Results.NoContent();
        }

        return ToHttpResult(result);
    }

    private static IResult ToHttpResult<T>(Result<T> result)
    {
        if (result.IsSuccess)
        {
            return Results.Ok(result.Value);
        }

        return ToProblemResult(result.Error!);
    }

    private static IResult ToHttpResult(Result result)
    {
        if (result.IsSuccess)
        {
            return Results.NoContent();
        }

        return ToProblemResult(result.Error!);
    }

    private static IResult ToProblemResult(Error error)
    {
        var statusCode = error.Code switch
        {
            "auth.invalid_credentials" => StatusCodes.Status401Unauthorized,
            "auth.invalid_refresh_token" => StatusCodes.Status401Unauthorized,
            "auth.email_in_use" => StatusCodes.Status409Conflict,
            "auth.invalid_email" => StatusCodes.Status400BadRequest,
            "auth.invalid_password" => StatusCodes.Status400BadRequest,
            "auth.invalid_role" => StatusCodes.Status400BadRequest,
            _ => StatusCodes.Status400BadRequest,
        };

        return Results.Problem(statusCode: statusCode, title: error.Code, detail: error.Message);
    }

    private static string? GetIpAddress(HttpContext httpContext) =>
        httpContext.Connection.RemoteIpAddress?.ToString();
}