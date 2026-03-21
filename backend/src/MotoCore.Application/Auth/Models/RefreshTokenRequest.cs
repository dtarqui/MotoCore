namespace MotoCore.Application.Auth.Models;

/// <summary>
/// Request model for refreshing an expired access token.
/// </summary>
/// <param name="RefreshToken">
/// The encrypted refresh token received from login or previous refresh.
/// Must be valid and not expired.
/// </param>
/// <remarks>
/// <para><strong>Example Request:</strong></para>
/// <code>
/// {
///   "refreshToken": "CfDJ8P2ZqB1..."
/// }
/// </code>
/// <para><strong>Success Response (200):</strong></para>
/// <code>
/// {
///   "accessToken": "eyJhbGc...",
///   "accessTokenExpiresAtUtc": "2024-03-21T12:30:00Z",
///   "refreshToken": "CfDJ8New...",
///   "refreshTokenExpiresAtUtc": "2024-04-21T12:00:00Z",
///   "user": { ... }
/// }
/// </code>
/// <para><strong>Error Responses:</strong></para>
/// <list type="bullet">
/// <item><description><c>400 Bad Request</c> - Invalid or malformed refresh token</description></item>
/// <item><description><c>401 Unauthorized</c> - Expired or revoked refresh token</description></item>
/// </list>
/// <para><strong>Error Codes:</strong></para>
/// <list type="bullet">
/// <item><description><c>auth.invalid_refresh_token</c> - Token is invalid or has been revoked</description></item>
/// <item><description><c>auth.refresh_token_expired</c> - Token has expired, user must login again</description></item>
/// </list>
/// <para><strong>Notes:</strong></para>
/// <list type="bullet">
/// <item><description>Always refresh tokens before they expire to maintain user session</description></item>
/// <item><description>Each refresh returns a new refresh token; the old one is invalidated</description></item>
/// <item><description>Refresh tokens are tied to IP address for security</description></item>
/// </list>
/// </remarks>
public sealed record RefreshTokenRequest(string RefreshToken);