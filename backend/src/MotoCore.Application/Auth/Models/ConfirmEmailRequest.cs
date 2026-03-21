namespace MotoCore.Application.Auth.Models;

/// <summary>
/// Request model for confirming user's email address.
/// </summary>
/// <param name="Email">
/// Email address to confirm.
/// Must match the email of the registered account.
/// </param>
/// <param name="Token">
/// Email confirmation token sent to the user's email.
/// This token is generated during registration.
/// </param>
/// <remarks>
/// <para><strong>Example Request:</strong></para>
/// <code>
/// {
///   "email": "john.doe@example.com",
///   "token": "CONFIRM123ABC..."
/// }
/// </code>
/// <para><strong>Success Response (200):</strong></para>
/// <code>
/// {
///   // Empty response on success
/// }
/// </code>
/// <para><strong>Error Responses:</strong></para>
/// <list type="bullet">
/// <item><description><c>400 Bad Request</c> - Invalid or expired token</description></item>
/// <item><description><c>404 Not Found</c> - Email not found</description></item>
/// </list>
/// <para><strong>Error Codes:</strong></para>
/// <list type="bullet">
/// <item><description><c>auth.invalid_confirmation_token</c> - Token is invalid or expired</description></item>
/// <item><description><c>auth.email_already_confirmed</c> - Email is already confirmed</description></item>
/// <item><description><c>auth.user_not_found</c> - No account with this email exists</description></item>
/// </list>
/// <para><strong>Email Confirmation Flow:</strong></para>
/// <list type="number">
/// <item><description>User registers via <c>POST /api/auth/register</c></description></item>
/// <item><description>Confirmation email is sent with a link containing the token</description></item>
/// <item><description>User clicks the link or submits this request manually</description></item>
/// <item><description>Email is marked as confirmed</description></item>
/// <item><description>User gains full access to all features</description></item>
/// </list>
/// <para><strong>Notes:</strong></para>
/// <list type="bullet">
/// <item><description>Some features may require email confirmation</description></item>
/// <item><description>If token expired, use <c>POST /api/auth/resend-confirmation</c></description></item>
/// </list>
/// </remarks>
public sealed record ConfirmEmailRequest(string Email, string Token);
