using MotoCore.Application.Auth.Models;
using MotoCore.Domain.Auth;
using MotoCore.Domain.Workshops;

namespace MotoCore.Application.Auth.Contracts;

public interface IJwtTokenGenerator
{
    AccessTokenResult Generate(UserAccount userAccount, IEnumerable<WorkshopMembership>? memberships = null);
}