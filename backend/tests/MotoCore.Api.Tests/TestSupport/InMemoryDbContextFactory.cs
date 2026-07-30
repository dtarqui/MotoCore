using Microsoft.EntityFrameworkCore;
using MotoCore.Infrastructure.Persistence;

namespace MotoCore.Api.Tests.TestSupport;

public static class InMemoryDbContextFactory
{
    public static MotoCoreDbContext Create()
    {
        var options = new DbContextOptionsBuilder<MotoCoreDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new MotoCoreDbContext(options);
    }
}
