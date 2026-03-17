using Microsoft.Extensions.DependencyInjection;
using MotoCore.Application.Auth.Contracts;
using MotoCore.Application.Auth.Services;

namespace MotoCore.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<IAuthService, AuthService>();
        return services;
    }
}