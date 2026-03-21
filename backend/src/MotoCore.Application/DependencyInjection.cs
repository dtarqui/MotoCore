using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using MotoCore.Application.Auth.Contracts;
using MotoCore.Application.Auth.Services;
using MotoCore.Application.Clients.Contracts;
using MotoCore.Application.Clients.Services;
using MotoCore.Application.Users.Contracts;
using MotoCore.Application.Users.Services;
using MotoCore.Application.Workshops.Contracts;
using MotoCore.Application.Workshops.Services;

namespace MotoCore.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<IWorkshopService, WorkshopService>();
        services.AddScoped<IClientService, ClientService>();

        services.AddValidatorsFromAssemblyContaining<IAuthService>(ServiceLifetime.Scoped);

        return services;
    }
}