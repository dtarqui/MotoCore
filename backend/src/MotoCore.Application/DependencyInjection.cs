using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using MotoCore.Application.Auth.Contracts;
using MotoCore.Application.Auth.Services;
using MotoCore.Application.Users.Contracts;
using MotoCore.Application.Users.Services;

namespace MotoCore.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IUserService, UserService>();

        // Register FluentValidation validators
        services.AddValidatorsFromAssemblyContaining<IAuthService>(ServiceLifetime.Scoped);

        return services;
    }
}