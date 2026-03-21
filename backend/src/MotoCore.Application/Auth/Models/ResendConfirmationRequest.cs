namespace MotoCore.Application.Auth.Models;

/// <summary>
/// Request model for resending email confirmation link.
/// </summary>
/// <param name="Email">
/// Email address of the account that needs a new confirmation email.
/// Must be a registered but unconfirmed email.
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
///   // Empty response. Email sent if conditions are met.
/// }
/// </code>
/// <para><strong>Error Responses:</strong></para>
/// <list type="bullet">
/// <item><description><c>400 Bad Request</c> - Invalid email format</description></item>
/// <item><description><c>404 Not Found</c> - Email not registered</description></item>
/// <item><description><c>429 Too Many Requests</c> - Too many requests in short period</description></item>
/// </list>
/// <para><strong>Error Codes:</strong></para>
/// <list type="bullet">
/// <item><description><c>auth.user_not_found</c> - No account with this email exists</description></item>
/// <item><description><c>auth.email_already_confirmed</c> - Email is already confirmed</description></item>
/// </list>
/// <para><strong>Use Cases:</strong></para>
/// <list type="bullet">
/// <item><description>Original confirmation email was not received</description></item>
/// <item><description>Confirmation token expired</description></item>
/// <item><description>User accidentally deleted the confirmation email</description></item>
/// </list>
/// <para><strong>Notes:</strong></para>
/// <list type="bullet">
/// <item><description>Rate limited to prevent spam (max requests per hour)</description></item>
/// <item><description>Previous confirmation tokens remain valid</description></item>
/// </list>
/// </remarks>
public sealed record ResendConfirmationRequest(string Email);
