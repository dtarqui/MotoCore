using MotoCore.Application.Auth.Models;
using MotoCore.Domain.Auth;

namespace MotoCore.Application.Auth.Contracts;

public interface IJwtTokenGenerator
{
    AccessTokenResult Generate(UserAccount userAccount);
}