namespace MotoCore.Application.Auth.Contracts;

public interface IEmailSender
{
    Task SendEmailConfirmationAsync(string toEmail, string firstName, string confirmationToken, CancellationToken cancellationToken = default);

    Task SendPasswordResetAsync(string toEmail, string firstName, string resetToken, CancellationToken cancellationToken = default);
}
