namespace MotoCore.Domain.Auth;

public sealed class ExternalLogin
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserAccountId { get; set; }
    public string Provider { get; set; } = string.Empty;
    public string ProviderSubject { get; set; } = string.Empty;
    public string? Email { get; set; }
    public DateTimeOffset LinkedAtUtc { get; set; } = DateTimeOffset.UtcNow;

    public UserAccount UserAccount { get; set; } = null!;
}