using Microsoft.Extensions.Logging;
using MotoCore.Application.Auth.Contracts;

namespace MotoCore.Infrastructure.Auth;

/// <summary>
/// Placeholder email sender that logs the message instead of delivering it.
/// Swap the registration in DependencyInjection.cs for a real provider
/// (SendGrid, SMTP, etc.) once one is chosen.
/// </summary>
public sealed class LoggingEmailSender(ILogger<LoggingEmailSender> logger) : IEmailSender
{
    public Task SendEmailConfirmationAsync(string toEmail, string firstName, string confirmationToken, CancellationToken cancellationToken = default)
    {
        logger.LogInformation(
            "[EMAIL STUB] Email confirmation for {Email} ({FirstName}). Token: {Token}",
            toEmail, firstName, confirmationToken);

        return Task.CompletedTask;
    }

    public Task SendPasswordResetAsync(string toEmail, string firstName, string resetToken, CancellationToken cancellationToken = default)
    {
        logger.LogInformation(
            "[EMAIL STUB] Password reset for {Email} ({FirstName}). Token: {Token}",
            toEmail, firstName, resetToken);

        return Task.CompletedTask;
    }
}
