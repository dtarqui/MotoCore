namespace MotoCore.Application.Auth.Models;

/// <summary>
/// Request model for changing user's password.
/// Requires authentication.
/// </summary>
/// <param name="CurrentPassword">
/// User's current password for verification.
/// Must match the password currently stored in the system.
/// </param>
/// <param name="NewPassword">
/// The new password to set. Must be at least 6 characters long.
/// Should be different from the current password.
/// </param>
/// <remarks>
/// <para><strong>Example Request:</strong></para>
/// <code>
/// {
///   "currentPassword": "OldPass123!",
///   "newPassword": "NewSecurePass456!"
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
/// <item><description><c>400 Bad Request</c> - Validation errors (password too short, etc.)</description></item>
/// <item><description><c>401 Unauthorized</c> - Not authenticated or invalid current password</description></item>
/// </list>
/// <para><strong>Error Codes:</strong></para>
/// <list type="bullet">
/// <item><description><c>auth.invalid_current_password</c> - Current password is incorrect</description></item>
/// <item><description><c>validation.password.too_short</c> - New password must be at least 6 characters</description></item>
/// <item><description><c>validation.password.same_as_current</c> - New password must be different from current</description></item>
/// </list>
/// <para><strong>Notes:</strong></para>
/// <list type="bullet">
/// <item><description>Requires valid access token in Authorization header</description></item>
/// <item><description>Password change does not invalidate existing tokens</description></item>
/// <item><description>User will need to login again on other devices after password change</description></item>
/// </list>
/// </remarks>
public sealed record ChangePasswordRequest(string CurrentPassword, string NewPassword);
