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

        group.MapPost("/change-password", ChangePassword)
            .WithName("ChangePassword")
            .WithSummary("Change the password for the authenticated user.")
            .WithValidation<ChangePasswordRequest>()
            .RequireAuthorization();

        group.MapPost("/forgot-password", ForgotPassword)
            .WithName("ForgotPassword")
            .WithSummary("Request a password reset token.")
            .WithValidation<ForgotPasswordRequest>();

        group.MapPost("/reset-password", ResetPassword)
            .WithName("ResetPassword")
            .WithSummary("Reset password using a reset token.")
            .WithValidation<ResetPasswordRequest>();

        group.MapPost("/confirm-email", ConfirmEmail)
            .WithName("ConfirmEmail")
            .WithSummary("Confirm email address using confirmation token.")
            .WithValidation<ConfirmEmailRequest>();

        group.MapPost("/resend-confirmation", ResendConfirmation)
            .WithName("ResendConfirmation")
            .WithSummary("Resend email confirmation token.")
            .WithValidation<ResendConfirmationRequest>();

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

    private static async Task<IResult> ChangePassword(ChangePasswordRequest request, HttpContext httpContext, IAuthService authService, CancellationToken cancellationToken)
    {
        var userId = httpContext.User.GetUserId();

        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var result = await authService.ChangePasswordAsync(userId.Value, request, cancellationToken);

        if (result.IsSuccess)
        {
            return Results.NoContent();
        }

        return result.ToHttpResult();
    }

    private static async Task<IResult> ForgotPassword(ForgotPasswordRequest request, IAuthService authService, CancellationToken cancellationToken)
    {
        var result = await authService.ForgotPasswordAsync(request, cancellationToken);

        if (result.IsSuccess)
        {
            return Results.Ok(new { message = "If the email exists, a password reset link has been sent." });
        }

        return result.ToHttpResult();
    }

    private static async Task<IResult> ResetPassword(ResetPasswordRequest request, IAuthService authService, CancellationToken cancellationToken)
    {
        var result = await authService.ResetPasswordAsync(request, cancellationToken);

        if (result.IsSuccess)
        {
            return Results.Ok(new { message = "Password has been reset successfully." });
        }

        return result.ToHttpResult();
    }

    private static async Task<IResult> ConfirmEmail(ConfirmEmailRequest request, IAuthService authService, CancellationToken cancellationToken)
    {
        var result = await authService.ConfirmEmailAsync(request, cancellationToken);

        if (result.IsSuccess)
        {
            return Results.Ok(new { message = "Email confirmed successfully." });
        }

        return result.ToHttpResult();
    }

    private static async Task<IResult> ResendConfirmation(ResendConfirmationRequest request, IAuthService authService, CancellationToken cancellationToken)
    {
        var result = await authService.ResendConfirmationAsync(request, cancellationToken);

        if (result.IsSuccess)
        {
            return Results.Ok(new { message = "If the email exists, a new confirmation link has been sent." });
        }

        return result.ToHttpResult();
    }

    private static string? GetIpAddress(HttpContext httpContext) =>
        httpContext.Connection.RemoteIpAddress?.ToString();
}