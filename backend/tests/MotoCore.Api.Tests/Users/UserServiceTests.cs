using MotoCore.Api.Tests.TestSupport;
using MotoCore.Application.Users.Models;
using MotoCore.Application.Users.Services;
using MotoCore.Domain.Auth;
using MotoCore.Infrastructure.Persistence;

namespace MotoCore.Api.Tests.Users;

public class UserServiceTests
{
    private static UserService CreateService(MotoCoreDbContext context) =>
        new(new UserIdentityRepository(context));

    private static async Task<UserAccount> SeedUserAsync(
        MotoCoreDbContext context,
        string email,
        string role = SystemRoles.Receptionist,
        bool emailConfirmed = true)
    {
        var user = new UserAccount
        {
            Email = email,
            NormalizedEmail = email.ToUpperInvariant(),
            PasswordHash = "test-hash",
            FirstName = "Test",
            LastName = "User",
            Role = role,
            EmailConfirmed = emailConfirmed,
        };

        context.Users.Add(user);
        await context.SaveChangesAsync();

        return user;
    }

    [Fact]
    public async Task GetAllUsersAsync_ReturnsAllSeededUsers()
    {
        await using var context = InMemoryDbContextFactory.Create();
        await SeedUserAsync(context, "a@test.com");
        await SeedUserAsync(context, "b@test.com");
        var service = CreateService(context);

        var result = await service.GetAllUsersAsync();

        Assert.True(result.IsSuccess);
        Assert.Equal(2, result.Value!.Count);
    }

    [Fact]
    public async Task GetUserByIdAsync_Succeeds_ForExistingUser()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var user = await SeedUserAsync(context, "a@test.com");
        var service = CreateService(context);

        var result = await service.GetUserByIdAsync(user.Id);

        Assert.True(result.IsSuccess);
        Assert.Equal("a@test.com", result.Value!.Email);
    }

    [Fact]
    public async Task GetUserByIdAsync_Fails_ForNonexistentUser()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var service = CreateService(context);

        var result = await service.GetUserByIdAsync(Guid.NewGuid());

        Assert.False(result.IsSuccess);
        Assert.Equal("user.not_found", result.Error!.Code);
    }

    [Fact]
    public async Task UpdateUserAsync_Succeeds_AndPersistsNameChanges()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var user = await SeedUserAsync(context, "a@test.com");
        var service = CreateService(context);

        var result = await service.UpdateUserAsync(
            user.Id, new UpdateUserRequest("Nuevo", "Nombre", null), modifiedByUserId: user.Id.ToString());

        Assert.True(result.IsSuccess);
        Assert.Equal("Nuevo", result.Value!.FirstName);
    }

    [Fact]
    public async Task UpdateUserAsync_Fails_ForInvalidRole()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var user = await SeedUserAsync(context, "a@test.com");
        var service = CreateService(context);

        var result = await service.UpdateUserAsync(
            user.Id, new UpdateUserRequest("Test", "User", "NotARole"), modifiedByUserId: null);

        Assert.False(result.IsSuccess);
        Assert.Equal("user.invalid_role", result.Error!.Code);
    }

    [Fact]
    public async Task UpdateUserAsync_Fails_ForNonexistentUser()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var service = CreateService(context);

        var result = await service.UpdateUserAsync(
            Guid.NewGuid(), new UpdateUserRequest("Test", "User", null), modifiedByUserId: null);

        Assert.False(result.IsSuccess);
        Assert.Equal("user.not_found", result.Error!.Code);
    }

    [Fact]
    public async Task UpdateUserRoleAsync_Succeeds_ForValidRole()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var user = await SeedUserAsync(context, "a@test.com", SystemRoles.Receptionist);
        var service = CreateService(context);

        var result = await service.UpdateUserRoleAsync(
            user.Id, new UpdateUserRoleRequest(SystemRoles.Mechanic), modifiedByUserId: Guid.NewGuid().ToString());

        Assert.True(result.IsSuccess);
        Assert.Equal(SystemRoles.Mechanic, result.Value!.Role);
    }

    [Fact]
    public async Task UpdateUserRoleAsync_Fails_ForInvalidRole()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var user = await SeedUserAsync(context, "a@test.com");
        var service = CreateService(context);

        var result = await service.UpdateUserRoleAsync(
            user.Id, new UpdateUserRoleRequest("SuperAdmin"), modifiedByUserId: null);

        Assert.False(result.IsSuccess);
        Assert.Equal("user.invalid_role", result.Error!.Code);
    }

    [Fact]
    public async Task DeleteUserAsync_RemovesUser()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var user = await SeedUserAsync(context, "a@test.com");
        var service = CreateService(context);

        var result = await service.DeleteUserAsync(user.Id);

        Assert.True(result.IsSuccess);
        var stillThere = await service.GetUserByIdAsync(user.Id);
        Assert.False(stillThere.IsSuccess);
    }

    [Fact]
    public async Task DeleteUserAsync_Fails_ForNonexistentUser()
    {
        await using var context = InMemoryDbContextFactory.Create();
        var service = CreateService(context);

        var result = await service.DeleteUserAsync(Guid.NewGuid());

        Assert.False(result.IsSuccess);
        Assert.Equal("user.not_found", result.Error!.Code);
    }

    [Fact]
    public async Task GetStatisticsAsync_CountsUsersByRoleAndConfirmation()
    {
        await using var context = InMemoryDbContextFactory.Create();
        await SeedUserAsync(context, "owner@test.com", SystemRoles.Owner, emailConfirmed: true);
        await SeedUserAsync(context, "mechanic@test.com", SystemRoles.Mechanic, emailConfirmed: false);
        var service = CreateService(context);

        var result = await service.GetStatisticsAsync();

        Assert.True(result.IsSuccess);
        Assert.Equal(2, result.Value!.TotalUsers);
        Assert.Equal(1, result.Value.ConfirmedUsers);
        Assert.Equal(1, result.Value.UnconfirmedUsers);
        Assert.Equal(1, result.Value.UsersByRole[SystemRoles.Owner]);
        Assert.Equal(1, result.Value.UsersByRole[SystemRoles.Mechanic]);
    }
}
