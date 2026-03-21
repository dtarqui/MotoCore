namespace MotoCore.Application.Auth.Models;

/// <summary>
/// Request model for user login authentication.
/// </summary>
/// <param name="Email">
/// User's email address. Must be a valid, registered email.
/// Example: "user@example.com"
/// </param>
/// <param name="Password">
/// User's password. Must match the password set during registration.
/// Minimum 6 characters required.
/// </param>
/// <remarks>
/// <para><strong>Example Request:</strong></para>
/// <code>
/// {
///   "email": "john.doe@example.com",
///   "password": "SecurePass123!"
/// }
/// </code>
/// <para><strong>Success Response (200):</strong></para>
/// <code>
/// {
///   "accessToken": "eyJhbGc...",
///   "accessTokenExpiresAtUtc": "2024-03-21T12:00:00Z",
///   "refreshToken": "encrypted-refresh-token",
///   "refreshTokenExpiresAtUtc": "2024-04-21T12:00:00Z",
///   "user": { ... }
/// }
/// </code>
/// <para><strong>Error Responses:</strong></para>
/// <list type="bullet">
/// <item><description><c>400 Bad Request</c> - Invalid email format or validation errors</description></item>
/// <item><description><c>401 Unauthorized</c> - Invalid credentials (wrong email or password)</description></item>
/// <item><description><c>403 Forbidden</c> - Email not confirmed</description></item>
/// </list>
/// <para><strong>Error Codes:</strong></para>
/// <list type="bullet">
/// <item><description><c>auth.invalid_credentials</c> - Email or password is incorrect</description></item>
/// <item><description><c>auth.email_not_confirmed</c> - User must confirm their email before logging in</description></item>
/// </list>
/// </remarks>
public sealed record LoginRequest(string Email, string Password);
