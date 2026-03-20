using MotoCore.Api.Extensions;
using MotoCore.Api.Filters;
using MotoCore.Application.Auth.Contracts;
using MotoCore.Application.Auth.Models;

namespace MotoCore.Api.Controllers;

public static class AuthController
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
            .WithSummary("Create a local account and issue access/refresh tokens.")
            .WithValidation<RegisterAccountRequest>();

        group.MapPost("/login", Login)
            .WithName("Login")
            .WithSummary("Authenticate a user with email and password.")
            .WithValidation<LoginRequest>();

        group.MapPost("/refresh-token", RefreshToken)
            .WithName("RefreshToken")
            .WithSummary("Rotate the refresh token and issue a new access token.")
            .WithValidation<RefreshTokenRequest>();

        group.MapPost("/logout", Logout)
            .WithName("Logout")
            .WithSummary("Revoke the current refresh token session.");

        return app;
    }

    private static async Task<IResult> GetExternalProviders(IAuthService authService, CancellationToken cancellationToken)
    {
        var result = await authService.GetExternalProvidersAsync(cancellationToken);
        return result.ToHttpResult();
    }

    private static async Task<IResult> Register(RegisterAccountRequest request, HttpContext httpContext, IAuthService authService, CancellationToken cancellationToken)
    {
        var result = await authService.RegisterAsync(request, GetIpAddress(httpContext), cancellationToken);

        if (result.IsSuccess)
        {
            return Results.Created("/api/auth/login", result.Value);
        }

        return result.ToHttpResult();
    }

    private static async Task<IResult> Login(LoginRequest request, HttpContext httpContext, IAuthService authService, CancellationToken cancellationToken)
    {
        var result = await authService.LoginAsync(request, GetIpAddress(httpContext), cancellationToken);
        return result.ToHttpResult();
    }

    private static async Task<IResult> RefreshToken(RefreshTokenRequest request, HttpContext httpContext, IAuthService authService, CancellationToken cancellationToken)
    {
        var result = await authService.RefreshTokenAsync(request, GetIpAddress(httpContext), cancellationToken);
        return result.ToHttpResult();
    }

    private static async Task<IResult> Logout(LogoutRequest request, HttpContext httpContext, IAuthService authService, CancellationToken cancellationToken)
    {
        var result = await authService.LogoutAsync(request, GetIpAddress(httpContext), cancellationToken);

        if (result.IsSuccess)
        {
            return Results.NoContent();
        }

        return result.ToHttpResult();
    }

    private static string? GetIpAddress(HttpContext httpContext) =>
        httpContext.Connection.RemoteIpAddress?.ToString();
}