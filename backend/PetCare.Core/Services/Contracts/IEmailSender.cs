namespace PetCare.Core.Services.Contracts
{
    /// <summary>
    /// Abstraction for sending transactional email notifications.
    /// Implementations are typically backed by SMTP or a third-party email provider.
    /// </summary>
    public interface IEmailSender
    {
        /// <summary>
        /// Sends an email message.
        /// </summary>
        /// <param name="toEmail">Recipient email address.</param>
        /// <param name="subject">Subject line.</param>
        /// <param name="body">Message body. May be plain text or HTML depending on the implementation.</param>
        Task SendAsync(string toEmail, string subject, string body);
    }
}

