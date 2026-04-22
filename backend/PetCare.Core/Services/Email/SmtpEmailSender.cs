using Microsoft.Extensions.Configuration;
using PetCare.Core.Services.Contracts;
using System.Net;
using System.Net.Mail;

namespace PetCare.Core.Services.Email;

/// <summary>
/// SMTP-backed implementation of <see cref="IEmailSender"/>.
/// Configuration is read from the <c>Email:Smtp</c> section.
/// When the host or "from" address is not configured the sender becomes a no-op
/// so local/dev environments work without a real mail server.
/// </summary>
public sealed class SmtpEmailSender(IConfiguration config) : IEmailSender
{
    private const int DefaultPort = 587;
    private const bool DefaultEnableSsl = true;

    /// <summary>
    /// Sends a plain-text email via the configured SMTP server. Silently succeeds when
    /// the SMTP host or "from" address are not configured.
    /// </summary>
    public async Task SendAsync(string toEmail, string subject, string body)
    {
        var host = config["Email:Smtp:Host"];
        var from = config["Email:Smtp:From"];

        // Safe no-op when not configured (keeps local/dev simple).
        if (string.IsNullOrWhiteSpace(host) || string.IsNullOrWhiteSpace(from))
            return;

        var port = int.TryParse(config["Email:Smtp:Port"], out var p) ? p : DefaultPort;
        var enableSsl = bool.TryParse(config["Email:Smtp:EnableSsl"], out var ssl) ? ssl : DefaultEnableSsl;

        using var client = new SmtpClient(host, port) { EnableSsl = enableSsl };

        var user = config["Email:Smtp:Username"];
        var pass = config["Email:Smtp:Password"];
        if (!string.IsNullOrWhiteSpace(user) && !string.IsNullOrWhiteSpace(pass))
        {
            client.Credentials = new NetworkCredential(user, pass);
        }

        using var message = new MailMessage(from, toEmail, subject, body) { IsBodyHtml = false };

        await client.SendMailAsync(message);
    }
}
