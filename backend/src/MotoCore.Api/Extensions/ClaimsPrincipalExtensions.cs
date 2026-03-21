using System.Security.Claims;

namespace MotoCore.Api.Extensions;

public static class ClaimsPrincipalExtensions
{
    public static Guid? GetUserId(this ClaimsPrincipal user)
    {
        var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrWhiteSpace(userIdClaim))
        {
            return null;
        }

        return Guid.TryParse(userIdClaim, out var userId) ? userId : null;
    }

    public static string? GetUserEmail(this ClaimsPrincipal user)
    {
        return user.FindFirst(ClaimTypes.Email)?.Value;
    }

    public static string? GetUserRole(this ClaimsPrincipal user)
    {
        return user.FindFirst(ClaimTypes.Role)?.Value;
    }

    public static IEnumerable<Guid> GetWorkshopIds(this ClaimsPrincipal user)
    {
        var workshopClaims = user.FindAll("workshop_id");

        foreach (var claim in workshopClaims)
        {
            if (Guid.TryParse(claim.Value, out var workshopId))
            {
                yield return workshopId;
            }
        }
    }

    public static Guid? GetFirstWorkshopId(this ClaimsPrincipal user)
    {
        return user.GetWorkshopIds().FirstOrDefault();
    }

    public static string? GetWorkshopRole(this ClaimsPrincipal user, Guid workshopId)
    {
        var workshopRoleClaims = user.FindAll("workshop_role");

        foreach (var claim in workshopRoleClaims)
        {
            var parts = claim.Value.Split(':');
            if (parts.Length == 2 && Guid.TryParse(parts[0], out var claimWorkshopId) && claimWorkshopId == workshopId)
            {
                return parts[1];
            }
        }

        return null;
    }
}
