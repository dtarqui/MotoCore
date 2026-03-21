using System.Net.Mail;

namespace MotoCore.Application.Common.Utilities;

public static class EmailValidator
{
    public static string NormalizeEmail(string email) => email.Trim().ToUpperInvariant();

    public static bool IsValidEmail(string email)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            return false;
        }

        try
        {
            var mailAddress = new MailAddress(email);
            return mailAddress.Address == email.Trim();
        }
        catch
        {
            return false;
        }
    }
}
