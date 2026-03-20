using Microsoft.IdentityModel.Tokens;
using MotoCore.Application.Auth.Contracts;
using MotoCore.Application.Auth.Models;
using MotoCore.Domain.Auth;
using MotoCore.Domain.Workshops;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace MotoCore.Infrastructure.Auth;

public sealed class JwtTokenGenerator(JwtOptions jwtOptions) : IJwtTokenGenerator
{
    public AccessTokenResult Generate(UserAccount userAccount, IEnumerable<WorkshopMembership>? memberships = null)
    {
        var expiresAtUtc = DateTimeOffset.UtcNow.AddMinutes(jwtOptions.AccessTokenMinutes);
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.SigningKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, userAccount.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, userAccount.Email),
            new(JwtRegisteredClaimNames.GivenName, userAccount.FirstName),
            new(JwtRegisteredClaimNames.FamilyName, userAccount.LastName),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new(ClaimTypes.NameIdentifier, userAccount.Id.ToString()),
            new(ClaimTypes.Name, userAccount.Email),
            new(ClaimTypes.Email, userAccount.Email),
            new(ClaimTypes.Role, userAccount.Role),
        };

        if (memberships is not null)
        {
            foreach (var membership in memberships.Where(m => m.IsActive))
            {
                claims.Add(new Claim("workshop_id", membership.WorkshopId.ToString()));
                claims.Add(new Claim("workshop_role", $"{membership.WorkshopId}:{membership.Role}"));
            }
        }

        var token = new JwtSecurityToken(
            issuer: jwtOptions.Issuer,
            audience: jwtOptions.Audience,
            claims: claims,
            notBefore: DateTime.UtcNow,
            expires: expiresAtUtc.UtcDateTime,
            signingCredentials: credentials);

        var tokenValue = new JwtSecurityTokenHandler().WriteToken(token);

        return new AccessTokenResult(tokenValue, expiresAtUtc);
    }
}