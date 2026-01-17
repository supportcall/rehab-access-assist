<?php

declare(strict_types=1);

namespace RehabSource\Controllers;

use RehabSource\Core\Auth;
use RehabSource\Core\Database;
use RehabSource\Core\Response;

/**
 * Email Controller
 * Handles secure email sending with queue and audit logging
 * IMPORTANT: Never includes clinical content in email body - uses secure portal links
 */
class EmailController
{
    /**
     * Queue an email for sending
     */
    public static function queue(array $data): string
    {
        $emailId = Database::generateUUID();
        $token = bin2hex(random_bytes(32));
        $expiresAt = date('Y-m-d H:i:s', strtotime('+7 days'));

        Database::execute(
            "INSERT INTO email_queue (id, recipient_email, recipient_name, subject, template_type, 
             template_data, secure_link_token, secure_link_expires, priority, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')",
            [
                $emailId,
                $data['to_email'],
                $data['to_name'] ?? null,
                $data['subject'],
                $data['template'],
                json_encode($data['data'] ?? []),
                $token,
                $expiresAt,
                $data['priority'] ?? 'normal'
            ]
        );

        return $emailId;
    }

    /**
     * Process email queue (called by cron job)
     */
    public static function processQueue(): void
    {
        // Get pending emails (max 50 per run)
        $emails = Database::query(
            "SELECT * FROM email_queue 
             WHERE status = 'pending' AND (scheduled_at IS NULL OR scheduled_at <= NOW())
             ORDER BY FIELD(priority, 'high', 'normal', 'low'), created_at
             LIMIT 50"
        );

        foreach ($emails as $email) {
            self::sendEmail($email);
        }
    }

    /**
     * Send a single email
     */
    private static function sendEmail(array $email): void
    {
        try {
            // Mark as processing
            Database::execute(
                "UPDATE email_queue SET status = 'processing', attempts = attempts + 1 WHERE id = ?",
                [$email['id']]
            );

            // Build email content from template
            $content = self::buildEmailContent($email);

            // Use PHPMailer or native mail
            $sent = self::dispatchEmail(
                $email['recipient_email'],
                $email['recipient_name'],
                $email['subject'],
                $content['html'],
                $content['text']
            );

            if ($sent) {
                Database::execute(
                    "UPDATE email_queue SET status = 'sent', sent_at = NOW() WHERE id = ?",
                    [$email['id']]
                );

                // Log audit
                Database::execute(
                    "INSERT INTO audit_log (id, action, entity_type, entity_id, metadata)
                     VALUES (?, 'email_sent', 'email_queue', ?, ?)",
                    [
                        Database::generateUUID(),
                        $email['id'],
                        json_encode(['recipient' => mask_email($email['recipient_email'])])
                    ]
                );
            } else {
                throw new \Exception('Email dispatch failed');
            }

        } catch (\Exception $e) {
            $attempts = $email['attempts'] + 1;
            $status = $attempts >= 3 ? 'failed' : 'pending';

            Database::execute(
                "UPDATE email_queue SET status = ?, last_error = ? WHERE id = ?",
                [$status, $e->getMessage(), $email['id']]
            );

            log_error("Email send failed: " . $e->getMessage(), ['email_id' => $email['id']]);
        }
    }

    /**
     * Build email content from template
     * SECURITY: Never include clinical content - only secure portal links
     */
    private static function buildEmailContent(array $email): array
    {
        $data = json_decode($email['template_data'], true) ?? [];
        $baseUrl = config('app.url');
        $secureLink = $baseUrl . '/secure/' . $email['secure_link_token'];

        // Common template variables
        $vars = [
            'recipient_name' => $email['recipient_name'] ?? 'Valued User',
            'secure_link' => $secureLink,
            'expires_at' => date('j M Y', strtotime($email['secure_link_expires'])),
            'support_email' => config('app.support_email', 'support@rehab-source.com'),
            'app_name' => config('app.name', 'Rehab Source')
        ];

        $vars = array_merge($vars, $data);

        // Get template content based on type
        $template = self::getTemplate($email['template_type'], $vars);

        return $template;
    }

    /**
     * Get email template by type
     */
    private static function getTemplate(string $type, array $vars): array
    {
        $templates = [
            'assessment_ready' => [
                'subject' => 'Your Assessment Report is Ready',
                'html' => self::wrapHtml(
                    "Hi {$vars['recipient_name']},<br><br>" .
                    "Your assessment report is now ready for review.<br><br>" .
                    "<a href=\"{$vars['secure_link']}\" style=\"background:#2563eb;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;\">View Report Securely</a><br><br>" .
                    "<small>This link expires on {$vars['expires_at']}. For security, clinical information is not included in this email.</small>"
                ),
                'text' => "Hi {$vars['recipient_name']},\n\nYour assessment report is ready.\n\nView it securely: {$vars['secure_link']}\n\nThis link expires on {$vars['expires_at']}."
            ],
            'share_pack_invitation' => [
                'subject' => 'Documents Shared with You',
                'html' => self::wrapHtml(
                    "Hi {$vars['recipient_name']},<br><br>" .
                    "Documents have been securely shared with you via {$vars['app_name']}.<br><br>" .
                    "<a href=\"{$vars['secure_link']}\" style=\"background:#2563eb;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;\">View Documents</a><br><br>" .
                    "<small>This link expires on {$vars['expires_at']}. Access requires verification.</small>"
                ),
                'text' => "Hi {$vars['recipient_name']},\n\nDocuments have been shared with you.\n\nView them: {$vars['secure_link']}\n\nExpires: {$vars['expires_at']}"
            ],
            'password_reset' => [
                'subject' => 'Reset Your Password',
                'html' => self::wrapHtml(
                    "Hi {$vars['recipient_name']},<br><br>" .
                    "A password reset was requested for your account.<br><br>" .
                    "<a href=\"{$vars['secure_link']}\" style=\"background:#2563eb;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;\">Reset Password</a><br><br>" .
                    "<small>This link expires in 1 hour. If you didn't request this, please ignore this email.</small>"
                ),
                'text' => "Hi {$vars['recipient_name']},\n\nReset your password: {$vars['secure_link']}\n\nExpires in 1 hour."
            ],
            'welcome' => [
                'subject' => "Welcome to {$vars['app_name']}",
                'html' => self::wrapHtml(
                    "Hi {$vars['recipient_name']},<br><br>" .
                    "Welcome to {$vars['app_name']}! Your account has been created.<br><br>" .
                    "<a href=\"{$vars['secure_link']}\" style=\"background:#2563eb;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;\">Complete Your Profile</a><br><br>" .
                    "If you have any questions, contact us at {$vars['support_email']}."
                ),
                'text' => "Hi {$vars['recipient_name']},\n\nWelcome to {$vars['app_name']}!\n\nComplete your profile: {$vars['secure_link']}"
            ],
            'appointment_reminder' => [
                'subject' => 'Appointment Reminder',
                'html' => self::wrapHtml(
                    "Hi {$vars['recipient_name']},<br><br>" .
                    "This is a reminder about your upcoming appointment.<br><br>" .
                    "<a href=\"{$vars['secure_link']}\" style=\"background:#2563eb;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;\">View Appointment Details</a><br><br>" .
                    "<small>For changes or cancellations, please contact us.</small>"
                ),
                'text' => "Hi {$vars['recipient_name']},\n\nReminder about your upcoming appointment.\n\nDetails: {$vars['secure_link']}"
            ]
        ];

        return $templates[$type] ?? [
            'html' => self::wrapHtml(
                "Hi {$vars['recipient_name']},<br><br>" .
                "You have a new notification from {$vars['app_name']}.<br><br>" .
                "<a href=\"{$vars['secure_link']}\">View in Portal</a>"
            ),
            'text' => "Hi {$vars['recipient_name']},\n\nYou have a notification.\n\nView: {$vars['secure_link']}"
        ];
    }

    /**
     * Wrap HTML content in email template
     */
    private static function wrapHtml(string $content): string
    {
        $appName = config('app.name', 'Rehab Source');
        $year = date('Y');

        return <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#1f2937;margin:0;padding:0;background:#f3f4f6;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;padding:20px;">
        <tr>
            <td style="background:#ffffff;border-radius:8px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
                <div style="text-align:center;margin-bottom:24px;">
                    <h1 style="margin:0;color:#2563eb;font-size:24px;">{$appName}</h1>
                </div>
                <div style="font-size:16px;">
                    {$content}
                </div>
            </td>
        </tr>
        <tr>
            <td style="text-align:center;padding:16px;font-size:12px;color:#6b7280;">
                © {$year} {$appName}. All rights reserved.<br>
                This email contains a secure link. Do not forward.
            </td>
        </tr>
    </table>
</body>
</html>
HTML;
    }

    /**
     * Dispatch email using PHPMailer or native mail
     */
    private static function dispatchEmail(
        string $toEmail,
        ?string $toName,
        string $subject,
        string $htmlBody,
        string $textBody
    ): bool {
        // Check if PHPMailer is available
        if (class_exists('PHPMailer\\PHPMailer\\PHPMailer')) {
            return self::sendWithPhpMailer($toEmail, $toName, $subject, $htmlBody, $textBody);
        }

        // Fallback to native mail
        return self::sendWithNativeMail($toEmail, $toName, $subject, $htmlBody, $textBody);
    }

    /**
     * Send using PHPMailer
     */
    private static function sendWithPhpMailer(
        string $toEmail,
        ?string $toName,
        string $subject,
        string $htmlBody,
        string $textBody
    ): bool {
        try {
            $mail = new \PHPMailer\PHPMailer\PHPMailer(true);

            // SMTP configuration from environment
            $mail->isSMTP();
            $mail->Host = env('SMTP_HOST', 'smtp.mailtrap.io');
            $mail->SMTPAuth = true;
            $mail->Username = env('SMTP_USERNAME', '');
            $mail->Password = env('SMTP_PASSWORD', '');
            $mail->SMTPSecure = env('SMTP_ENCRYPTION', 'tls');
            $mail->Port = (int) env('SMTP_PORT', 587);

            // From
            $mail->setFrom(
                env('MAIL_FROM_ADDRESS', 'noreply@rehab-source.com'),
                env('MAIL_FROM_NAME', 'Rehab Source')
            );

            // To
            $mail->addAddress($toEmail, $toName ?? '');

            // Content
            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body = $htmlBody;
            $mail->AltBody = $textBody;

            return $mail->send();

        } catch (\Exception $e) {
            log_error("PHPMailer error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Send using native mail function
     */
    private static function sendWithNativeMail(
        string $toEmail,
        ?string $toName,
        string $subject,
        string $htmlBody,
        string $textBody
    ): bool {
        $boundary = md5(time());
        
        $headers = [
            'MIME-Version: 1.0',
            'Content-Type: multipart/alternative; boundary="' . $boundary . '"',
            'From: ' . env('MAIL_FROM_NAME', 'Rehab Source') . ' <' . env('MAIL_FROM_ADDRESS', 'noreply@rehab-source.com') . '>',
            'Reply-To: ' . env('MAIL_FROM_ADDRESS', 'noreply@rehab-source.com'),
            'X-Mailer: PHP/' . phpversion()
        ];

        $body = "--{$boundary}\r\n";
        $body .= "Content-Type: text/plain; charset=UTF-8\r\n";
        $body .= "Content-Transfer-Encoding: base64\r\n\r\n";
        $body .= chunk_split(base64_encode($textBody)) . "\r\n";
        $body .= "--{$boundary}\r\n";
        $body .= "Content-Type: text/html; charset=UTF-8\r\n";
        $body .= "Content-Transfer-Encoding: base64\r\n\r\n";
        $body .= chunk_split(base64_encode($htmlBody)) . "\r\n";
        $body .= "--{$boundary}--";

        $to = $toName ? "{$toName} <{$toEmail}>" : $toEmail;

        return mail($to, $subject, $body, implode("\r\n", $headers));
    }

    /**
     * Verify secure link token
     */
    public static function verifySecureLink(string $token): ?array
    {
        $email = Database::queryOne(
            "SELECT * FROM email_queue 
             WHERE secure_link_token = ? 
             AND secure_link_expires > NOW()
             AND status = 'sent'",
            [$token]
        );

        if ($email) {
            // Log access
            Database::execute(
                "INSERT INTO audit_log (id, action, entity_type, entity_id, metadata)
                 VALUES (?, 'secure_link_accessed', 'email_queue', ?, ?)",
                [
                    Database::generateUUID(),
                    $email['id'],
                    json_encode(['ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'])
                ]
            );
        }

        return $email;
    }
}
