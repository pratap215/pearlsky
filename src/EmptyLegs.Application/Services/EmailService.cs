using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace EmptyLegs.Application.Services;

public class EmailService
{
    private readonly IConfiguration _config;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IConfiguration config, ILogger<EmailService> logger)
    {
        _config = config;
        _logger = logger;
    }

    public async Task SendAsync(string toEmail, string toName, string subject, string htmlBody)
    {
        var enabled = _config.GetValue<bool>("Email:Enabled");
        if (!enabled)
        {
            _logger.LogInformation("[EMAIL-MOCK] To: {Email} | Subject: {Subject}", toEmail, subject);
            return;
        }

        try
        {
            var host = _config["Email:SmtpHost"] ?? "smtp.gmail.com";
            var port = _config.GetValue<int>("Email:SmtpPort", 587);
            var useSsl = _config.GetValue<bool>("Email:UseSsl", true);
            var username = _config["Email:Username"] ?? "";
            var password = _config["Email:Password"] ?? "";
            var fromName = _config["Email:FromName"] ?? "JetFlux";
            var fromAddress = _config["Email:FromAddress"] ?? "noreply@jetflux.com";

            using var client = new SmtpClient(host, port)
            {
                EnableSsl = useSsl,
                Credentials = new NetworkCredential(username, password)
            };

            var message = new MailMessage
            {
                From = new MailAddress(fromAddress, fromName),
                Subject = subject,
                Body = htmlBody,
                IsBodyHtml = true
            };
            message.To.Add(new MailAddress(toEmail, toName));

            await client.SendMailAsync(message);
            _logger.LogInformation("[EMAIL] Sent to {Email}: {Subject}", toEmail, subject);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[EMAIL] Failed to send to {Email}: {Subject}", toEmail, subject);
        }
    }

    public async Task SendNewEmptyLegNotificationAsync(
        string toEmail, string toName, string jetModel,
        string origin, string destination, decimal price, string tailNumber)
    {
        var subject = $"\u2708 New JetFlux flight: {jetModel} \u2014 {origin} \u2192 {destination}";
        var html = $"""
            <div style="font-family:'Inter',sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);">
              <div style="background:#0A0F2E;padding:28px 24px;text-align:center;">
                <div style="display:inline-flex;align-items:center;gap:10px;">
                  <div style="width:40px;height:40px;background:#FFB800;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;">
                    <span style="color:#0A0F2E;font-size:20px;font-weight:900;">\u2708</span>
                  </div>
                  <h1 style="color:#fff;margin:0;font-size:26px;font-weight:900;letter-spacing:-0.5px;">Jet<span style="color:#FFB800;">Flux</span></h1>
                </div>
                <p style="color:rgba(255,255,255,0.6);margin:8px 0 0;font-size:13px;">Fly Exclusive. Pay Smart.</p>
              </div>
              <div style="padding:32px 24px;">
                <h2 style="color:#0A0F2E;margin:0 0 8px;font-size:20px;">New Flight Available on Your Subscribed Jet!</h2>
                <p style="color:#555;margin:0 0 24px;font-size:15px;">A new empty leg has been posted for <strong>{jetModel}</strong> ({tailNumber}).</p>
                <div style="background:#f8f9ff;border:1px solid #e0e7ff;border-radius:10px;padding:20px;margin-bottom:24px;">
                  <div style="display:flex;justify-content:space-between;align-items:center;">
                    <div>
                      <p style="margin:0;font-size:22px;font-weight:800;color:#0A0F2E;letter-spacing:-0.5px;">{origin} &rarr; {destination}</p>
                    </div>
                    <div style="text-align:right;">
                      <p style="margin:0;font-size:13px;color:#888;">from</p>
                      <p style="margin:0;font-size:22px;font-weight:800;color:#FFB800;">\u20b9{price:N0}</p>
                    </div>
                  </div>
                </div>
                <a href="http://localhost:4200/flights" style="display:block;background:#FFB800;color:#0A0F2E;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;text-align:center;">
                  \u2708 Book This Flight
                </a>
              </div>
              <div style="background:#f5f5f5;padding:16px 24px;text-align:center;">
                <p style="color:#aaa;font-size:12px;margin:0;">&copy; 2026 JetFlux. You received this because you subscribed to this jet.</p>
              </div>
            </div>
            """;
        await SendAsync(toEmail, toName, subject, html);
    }
}
