namespace MotoCore.Application.Auth.Models;

/// <summary>
/// Request model for initiating password reset process.
/// Sends a password reset email to the user.
/// </summary>
/// <param name="Email">
/// Email address of the account for which to reset the password.
/// Must be a registered email address.
/// </param>
/// <remarks>
/// <para><strong>Example Request:</strong></para>
/// <code>
/// {
///   "email": "john.doe@example.com"
/// }
/// </code>
/// <para><strong>Success Response (200):</strong></para>
/// <code>
/// {
///   // Empty response. Email sent if account exists.
/// }
/// </code>
/// <para><strong>Notes:</strong></para>
/// <list type="bullet">
/// <item><description>Always returns success (200) even if email doesn't exist (security measure)</description></item>
/// <item><description>If email exists, a password reset link will be sent</description></item>
/// <item><description>Reset token expires after a limited time (typically 1 hour)</description></item>
/// <item><description>User should check their email for reset instructions</description></item>
/// <item><description>Rate limited to prevent abuse (max requests per hour)</description></item>
/// </list>
/// <para><strong>Error Responses:</strong></para>
/// <list type="bullet">
/// <item><description><c>400 Bad Request</c> - Invalid email format</description></item>
/// <item><description><c>429 Too Many Requests</c> - Too many reset requests in short period</description></item>
/// </list>
/// </remarks>
public sealed record ForgotPasswordRequest(string Email);
