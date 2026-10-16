const nodemailer = require('nodemailer');

let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;

  if (process.env.SMTP_HOST) {
    _transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      // Strict connection timeouts to prevent hanging on blocked ports
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 10000,
    });
  }

  return _transporter;
}

/**
 * Send a password-reset email.
 * @param {string} toEmail  - recipient address
 * @param {string} resetUrl - full URL the user should visit
 */
async function sendPasswordResetEmail(toEmail, resetUrl) {
  // If no SMTP host is configured:
  if (!process.env.SMTP_HOST) {
    if (process.env.NODE_ENV === 'production') {
      console.error(`[mailer] ERROR: Password reset requested for ${toEmail}, but SMTP_HOST is not configured in production.`);
      throw new Error('SMTP service is not configured. Real email delivery requires SMTP environment variables.');
    }

    // Local development only: log to terminal
    console.log('\n======================================================');
    console.log('[mailer] [DEV ONLY] No SMTP_HOST configured — simulated email dispatch');
    console.log(`[mailer] [DEV ONLY] Recipient: ${toEmail}`);
    console.log(`[mailer] [DEV ONLY] Reset URL:  ${resetUrl}`);
    console.log('======================================================\n');
    return { sent: false, simulated: true, resetUrl };
  }

  const from = process.env.SMTP_FROM || `"Loksewa Prep" <no-reply@loksewa-prep.local>`;
  const transporter = getTransporter();

  const info = await transporter.sendMail({
    from,
    to: toEmail,
    subject: 'Loksewa Prep — Password Reset Request',
    text: [
      'You requested a password reset for your Loksewa Prep account.',
      '',
      'Click the link below to set a new password (valid for 1 hour):',
      '',
      resetUrl,
      '',
      'If you did not request this, please ignore this email.',
      'Your password will remain unchanged.',
    ].join('\n'),
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px 24px;background:#f9fafb;border-radius:12px;border:1px solid #e5e7eb">
        <h2 style="color:#2563eb;margin:0 0 16px">📚 Loksewa Prep</h2>
        <h3 style="margin:0 0 12px;color:#111827">Password Reset</h3>
        <p style="color:#374151">You requested a password reset. Click the button below to set a new password. This link expires in <strong>1 hour</strong>.</p>
        <div style="text-align:center;margin:28px 0">
          <a href="${resetUrl}" style="display:inline-block;padding:12px 28px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
            Reset Password
          </a>
        </div>
        <p style="color:#6b7280;font-size:13px">Or copy this URL into your browser:<br><a href="${resetUrl}" style="color:#2563eb;word-break:break-all">${resetUrl}</a></p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
        <p style="color:#9ca3af;font-size:12px">If you did not request this, ignore this email. Your password won't change.</p>
      </div>
    `,
  });

  return { sent: true, simulated: false, messageId: info.messageId };
}

module.exports = { sendPasswordResetEmail };
