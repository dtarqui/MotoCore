namespace MotoCore.Application.Auth.Models;

/// <summary>
/// Request model for completing the password reset process.
/// </summary>
/// <param name="Email">
/// Email address of the account being reset.
/// Must match the email used in the forgot password request.
/// </param>
/// <param name="Token">
/// Password reset token received via email.
/// This token is time-limited and single-use.
/// </param>
/// <param name="NewPassword">
/// The new password to set for the account.
/// Must be at least 6 characters long.
/// </param>
/// <remarks>
/// <para><strong>Example Request:</strong></para>
/// <code>
/// {
///   "email": "john.doe@example.com",
///   "token": "ABC123XYZ789...",
///   "newPassword": "NewSecurePass123!"
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
/// <item><description><c>400 Bad Request</c> - Invalid or expired token, weak password</description></item>
/// <item><description><c>404 Not Found</c> - Email not found</description></item>
/// </list>
/// <para><strong>Error Codes:</strong></para>
/// <list type="bullet">
/// <item><description><c>auth.invalid_reset_token</c> - Token is invalid, expired, or already used</description></item>
/// <item><description><c>auth.user_not_found</c> - No account with this email exists</description></item>
/// <item><description><c>validation.password.too_short</c> - Password must be at least 6 characters</description></item>
/// </list>
/// <para><strong>Password Reset Flow:</strong></para>
/// <list type="number">
/// <item><description>User requests password reset via <c>POST /api/auth/forgot-password</c></description></item>
/// <item><description>User receives email with reset link containing the token</description></item>
/// <item><description>User submits this request with email, token, and new password</description></item>
/// <item><description>Password is updated and all existing tokens are invalidated</description></item>
/// <item><description>User must login again with the new password</description></item>
/// </list>
/// </remarks>
public sealed record ResetPasswordRequest(string Email, string Token, string NewPassword);
