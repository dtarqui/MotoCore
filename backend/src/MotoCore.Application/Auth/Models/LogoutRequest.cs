namespace MotoCore.Application.Auth.Models;

/// <summary>
/// Request model for logging out and revoking refresh token.
/// </summary>
/// <param name="RefreshToken">
/// The refresh token to revoke.
/// After logout, this token and all its descendants cannot be used.
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
///   // Empty response on success
/// }
/// </code>
/// <para><strong>Notes:</strong></para>
/// <list type="bullet">
/// <item><description>Revokes the specified refresh token and any tokens derived from it</description></item>
/// <item><description>Access tokens remain valid until they expire naturally</description></item>
/// <item><description>Client should discard both access and refresh tokens after logout</description></item>
/// <item><description>Always returns success, even if token is already revoked</description></item>
/// </list>
/// <para><strong>Best Practices:</strong></para>
/// <list type="bullet">
/// <item><description>Call this endpoint when user explicitly logs out</description></item>
/// <item><description>Clear all stored tokens from client storage</description></item>
/// <item><description>Redirect user to login page</description></item>
/// </list>
/// </remarks>
public sealed record LogoutRequest(string RefreshToken);