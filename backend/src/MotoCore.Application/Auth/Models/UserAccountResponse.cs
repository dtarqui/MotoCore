namespace MotoCore.Application.Auth.Models;

/// <summary>
/// Response model containing basic user account information.
/// Included in AuthResponse and user profile endpoints.
/// </summary>
/// <param name="Id">
/// Unique identifier for the user account (GUID).
/// Use this ID for user-specific operations.
/// </param>
/// <param name="Email">
/// User's email address. Unique across the system.
/// Used for login and communications.
/// </param>
/// <param name="FirstName">
/// User's first name as provided during registration.
/// </param>
/// <param name="LastName">
/// User's last name as provided during registration.
/// </param>
/// <param name="Role">
/// User's role in the system. Determines access permissions.
/// Possible values:
/// <list type="bullet">
/// <item><description><c>Owner</c> - Full access to workshop management</description></item>
/// <item><description><c>Mechanic</c> - Can manage work orders and technical operations</description></item>
/// <item><description><c>Receptionist</c> - Can manage clients, appointments, and front desk operations</description></item>
/// </list>
/// </param>
/// <remarks>
/// <para><strong>Example Response:</strong></para>
/// <code>
/// {
///   "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
///   "email": "john.doe@example.com",
///   "firstName": "John",
///   "lastName": "Doe",
///   "role": "Owner"
/// }
/// </code>
/// <para><strong>Role Permissions:</strong></para>
/// <list type="table">
/// <listheader>
/// <term>Role</term>
/// <description>Permissions</description>
/// </listheader>
/// <item>
/// <term>Owner</term>
/// <description>Full access: manage users, workshops, all business operations</description>
/// </item>
/// <item>
/// <term>Mechanic</term>
/// <description>Work orders, inventory usage, maintenance records</description>
/// </item>
/// <item>
/// <term>Receptionist</term>
/// <description>Client management, scheduling, basic inventory</description>
/// </item>
/// </list>
/// </remarks>
public sealed record UserAccountResponse(
    Guid Id,
    string Email,
    string FirstName,
    string LastName,
    string Role);