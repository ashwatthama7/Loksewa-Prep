/**
 * Email service — wraps nodemailer.
 *
 * In development (NODE_ENV !== 'production') AND when no SMTP_HOST is set,
 * it creates a one-time Ethereal test account and prints the preview URL to
 * the console instead of sending a real email — zero config needed for local dev.
 *
 * For production set these env vars:
 *   SMTP_HOST, SMTP_PORT, SMTP_SECURE (true/false),
 *   SMTP_USER, SMTP_PASS, SMTP_FROM
 *
 * You can also use Gmail with App Passwords, SendGrid, Mailgun, etc.
 */
const nodemailer = require('nodemailer');

let _transporter = null;

async function getTransporter() {
  if (_transporter) return _transporter;

  if (process.env.SMTP_HOST) {
    // ── Production / configured SMTP ─────────────────────────────────────
    _transporter = nodemailer.createTransport({
      host:   process.env.SMTP_HOST,
      port:   parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // ── Development fallback: Ethereal (fake inbox, messages shown in console) ─
    console.log('[mailer] No SMTP_HOST set — using Ethereal test account.');
    const testAccount = await nodemailer.createTestAccount();
    _transporter = nodemailer.createTransport({
      host:   'smtp.ethereal.email',
      port:   587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
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
  const from = process.env.SMTP_FROM || '"Master Quiz" <no-reply@masterquiz.local>';
  const transporter = await getTransporter();

  const info = await transporter.sendMail({
    from,
    to: toEmail,
    subject: 'Master Quiz — Password Reset',
    text: [
      'You requested a password reset for your Master Quiz account.',
      '',
      'Click the link below to set a new password (valid for 1 hour):',
      '',
      resetUrl,
      '',
      'If you did not request this, please ignore this email.',
      'Your password will remain unchanged.',
    ].join('\n'),
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px 24px;background:#f9fafb;border-radius:12px">
        <h2 style="color:#1e40af;margin:0 0 16px">🧠 Master Quiz</h2>
        <h3 style="margin:0 0 12px;color:#111827">Password Reset</h3>
        <p style="color:#374151">You requested a password reset. Click the button below to set a new password. This link expires in <strong>1 hour</strong>.</p>
        <a href="${resetUrl}" style="display:inline-block;margin:20px 0;padding:12px 28px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
          Reset Password
        </a>
        <p style="color:#6b7280;font-size:13px">Or copy this URL into your browser:<br><a href="${resetUrl}" style="color:#2563eb">${resetUrl}</a></p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
        <p style="color:#9ca3af;font-size:12px">If you did not request this, ignore this email. Your password won't change.</p>
      </div>
    `,
  });

  // In dev, print the Ethereal preview URL so you can see the email immediately
  if (!process.env.SMTP_HOST) {
    console.log(`[mailer] Password reset email preview: ${nodemailer.getTestMessageUrl(info)}`);
  }
}

module.exports = { sendPasswordResetEmail };
