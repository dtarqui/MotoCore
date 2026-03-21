namespace MotoCore.Application.Auth.Models;

/// <summary>
/// Request model for new user registration.
/// </summary>
/// <param name="Email">
/// User's email address. Must be unique and valid.
/// Example: "user@example.com"
/// </param>
/// <param name="Password">
/// User's password. Must be at least 6 characters long.
/// Should contain a mix of uppercase, lowercase, numbers, and special characters.
/// </param>
/// <param name="FirstName">
/// User's first name. Maximum 100 characters.
/// Example: "John"
/// </param>
/// <param name="LastName">
/// User's last name. Maximum 100 characters.
/// Example: "Doe"
/// </param>
/// <param name="Role">
/// Optional in request payload, but registration only allows "Owner".
/// </param>
/// <param name="WorkshopName">
/// Required. Name of the workshop to create. Maximum 200 characters.
/// Example: "Joe's Motorcycle Shop"
/// </param>
/// <remarks>
/// <para><strong>Example Request:</strong></para>
/// <code>
/// {
///   "email": "john.doe@example.com",
///   "password": "SecurePass123!",
///   "firstName": "John",
///   "lastName": "Doe",
///   "role": "Owner",
///   "workshopName": "Joe's Motorcycle Shop"
/// }
/// </code>
/// <para><strong>Success Response (201):</strong></para>
/// <code>
/// {
///   "accessToken": "eyJhbGc...",
///   "accessTokenExpiresAtUtc": "2024-03-21T12:00:00Z",
///   "refreshToken": "encrypted-refresh-token",
///   "refreshTokenExpiresAtUtc": "2024-04-21T12:00:00Z",
///   "user": {
///     "id": "guid",
///     "email": "john.doe@example.com",
///     "firstName": "John",
///     "lastName": "Doe",
///     "role": "Owner",
///     "isEmailConfirmed": false
///   }
/// }
/// </code>
/// <para><strong>Error Responses:</strong></para>
/// <list type="bullet">
/// <item><description><c>400 Bad Request</c> - Validation errors (invalid email, weak password, etc.)</description></item>
/// <item><description><c>409 Conflict</c> - Email already registered</description></item>
/// </list>
/// <para><strong>Error Codes:</strong></para>
/// <list type="bullet">
/// <item><description><c>auth.email_already_exists</c> - An account with this email already exists</description></item>
/// <item><description><c>validation.email.invalid</c> - Email format is invalid</description></item>
/// <item><description><c>validation.password.too_short</c> - Password must be at least 6 characters</description></item>
/// </list>
/// <para><strong>Notes:</strong></para>
/// <list type="bullet">
/// <item><description>After registration, a confirmation email will be sent to verify the email address</description></item>
/// <item><description>User can login immediately, but some features may require email confirmation</description></item>
/// <item><description>New public registrations are always created with the Owner role</description></item>
/// </list>
/// </remarks>
public sealed record RegisterAccountRequest(
    string Email,
    string Password,
    string FirstName,
    string LastName,
    string? Role,
    string? WorkshopName);
