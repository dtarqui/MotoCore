namespace MotoCore.Application.Auth.Models;

/// <summary>
/// Response model containing authentication tokens and user information.
/// Returned after successful login, registration, or token refresh.
/// </summary>
/// <param name="AccessToken">
/// JWT access token used for authenticating API requests.
/// Include this token in the Authorization header: "Bearer {AccessToken}"
/// Short-lived (typically 15-60 minutes).
/// </param>
/// <param name="AccessTokenExpiresAtUtc">
/// UTC timestamp when the access token expires.
/// Client should refresh the token before this time to avoid authentication errors.
/// </param>
/// <param name="RefreshToken">
/// Encrypted refresh token used to obtain a new access token.
/// Long-lived (typically 7-30 days). Store securely.
/// </param>
/// <param name="RefreshTokenExpiresAtUtc">
/// UTC timestamp when the refresh token expires.
/// User must login again after this time.
/// </param>
/// <param name="User">
/// Complete user account information including profile and role.
/// </param>
/// <remarks>
/// <para><strong>Example Response:</strong></para>
/// <code>
/// {
///   "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
///   "accessTokenExpiresAtUtc": "2024-03-21T12:30:00Z",
///   "refreshToken": "CfDJ8P2ZqB1...",
///   "refreshTokenExpiresAtUtc": "2024-04-21T11:30:00Z",
///   "user": {
///     "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
///     "email": "john.doe@example.com",
///     "firstName": "John",
///     "lastName": "Doe",
///     "role": "Owner",
///     "isEmailConfirmed": true
///   }
/// }
/// </code>
/// <para><strong>Using the Access Token:</strong></para>
/// <para>Include the access token in all authenticated API requests:</para>
/// <code>
/// Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
/// </code>
/// <para><strong>Token Refresh Flow:</strong></para>
/// <list type="number">
/// <item><description>Monitor the <c>AccessTokenExpiresAtUtc</c> timestamp</description></item>
/// <item><description>Before expiration, call <c>POST /api/auth/refresh-token</c> with the refresh token</description></item>
/// <item><description>Receive new access token and refresh token</description></item>
/// <item><description>Update stored tokens and continue making authenticated requests</description></item>
/// </list>
/// <para><strong>Security Notes:</strong></para>
/// <list type="bullet">
/// <item><description>Store tokens securely (never in localStorage in production)</description></item>
/// <item><description>Access tokens are short-lived for security</description></item>
/// <item><description>Refresh tokens are encrypted and can be revoked</description></item>
/// <item><description>Tokens are tied to the user's IP address for additional security</description></item>
/// </list>
/// </remarks>
public sealed record AuthResponse(
    string AccessToken,
    DateTimeOffset AccessTokenExpiresAtUtc,
    string RefreshToken,
    DateTimeOffset RefreshTokenExpiresAtUtc,
    UserAccountResponse User);
