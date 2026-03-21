using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using MotoCore.Application.Auth.Contracts;
using MotoCore.Application.Auth.Services;
using MotoCore.Application.Clients.Contracts;
using MotoCore.Application.Clients.Services;
using MotoCore.Application.Inventory.Contracts;
using MotoCore.Application.Inventory.Services;
using MotoCore.Application.MaintenanceHistory.Contracts;
using MotoCore.Application.MaintenanceHistory.Services;
using MotoCore.Application.Motorcycles.Contracts;
using MotoCore.Application.Motorcycles.Services;
using MotoCore.Application.Users.Contracts;
using MotoCore.Application.Users.Services;
using MotoCore.Application.WorkOrders.Contracts;
using MotoCore.Application.WorkOrders.Services;
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
        services.AddScoped<IMotorcycleService, MotorcycleService>();
        services.AddScoped<IWorkOrderService, WorkOrderService>();
        services.AddScoped<IInventoryService, InventoryService>();
        services.AddScoped<IMaintenanceHistoryService, MaintenanceHistoryService>();

        services.AddValidatorsFromAssemblyContaining<IAuthService>(ServiceLifetime.Scoped);

        return services;
    }
}